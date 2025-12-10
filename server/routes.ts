import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireLevel } from "./replitAuth";
import { insertPromotionRequestSchema, insertVoteSchema, type User } from "@shared/schema";
import { z } from "zod";

// Helper to sanitize user data based on viewer's level
function sanitizeUser(user: User, viewerLevel: number): Partial<User> {
  // Level 5 can see everything
  if (viewerLevel >= 5) {
    return user;
  }
  
  // Others can see basic info but not email
  const { email, ...rest } = user;
  return rest;
}

// Helper to filter and sanitize users list
function filterAndSanitizeUsers(users: User[], viewerLevel: number): Partial<User>[] {
  return users
    .filter(u => u.level <= viewerLevel) // Only show users at same level or below
    .map(u => sanitizeUser(u, viewerLevel));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithInviter(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get additional stats
      const invitees = await storage.getInvitees(userId);
      
      res.json({
        ...user,
        inviteCount: invitees.length,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check if first user setup is needed
  app.get("/api/auth/setup-required", async (req, res) => {
    try {
      const userCount = await storage.getUserCount();
      res.json({ setupRequired: userCount === 0 });
    } catch (error) {
      console.error("Error checking setup:", error);
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  // Validate invite token
  app.get("/api/invite/:token", async (req, res) => {
    try {
      const link = await storage.getInviteLinkByToken(req.params.token);
      if (!link || link.status !== "active") {
        return res.status(404).json({ valid: false, message: "Invalid or expired invite link" });
      }
      
      const inviter = await storage.getUser(link.invitedByUserId);
      res.json({
        valid: true,
        inviterName: inviter ? `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || inviter.email : "Unknown",
      });
    } catch (error) {
      console.error("Error validating invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  // === User endpoints ===
  
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      if (!requestingUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      const allUsers = await storage.getUsersByLevel(level);
      
      // Filter users to only show those at or below the viewer's level
      // and sanitize based on viewer's level (hide emails unless Level 5)
      const visibleUsers = filterAndSanitizeUsers(allUsers, requestingUser.level);
      
      res.json(visibleUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      if (!requestingUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const user = await storage.getUserWithInviter(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check visibility: can only see users at or below your level
      if (user.level > requestingUser.level) {
        return res.status(403).json({ message: "You cannot view this user's profile" });
      }
      
      const invitees = await storage.getInvitees(req.params.id);
      
      // Sanitize the user, inviter, and invitees based on viewer's level
      const sanitizedUser = sanitizeUser(user, requestingUser.level);
      const sanitizedInviter = user.inviter ? sanitizeUser(user.inviter, requestingUser.level) : undefined;
      const sanitizedInvitees = filterAndSanitizeUsers(invitees, requestingUser.level);
      
      res.json({
        ...sanitizedUser,
        inviter: sanitizedInviter,
        invitees: sanitizedInvitees,
        inviteCount: invitees.length,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/invitees", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      if (!requestingUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const invitees = await storage.getInvitees(req.params.id);
      const sanitizedInvitees = filterAndSanitizeUsers(invitees, requestingUser.level);
      res.json(sanitizedInvitees);
    } catch (error) {
      console.error("Error fetching invitees:", error);
      res.status(500).json({ message: "Failed to fetch invitees" });
    }
  });

  // Direct level change (Level 5 only)
  app.post("/api/users/:id/level", isAuthenticated, requireLevel(5), async (req: any, res) => {
    try {
      const { newLevel, reason } = req.body;
      if (!newLevel || !reason) {
        return res.status(400).json({ message: "newLevel and reason are required" });
      }
      
      const user = await storage.updateUserLevel(
        req.params.id,
        newLevel,
        req.user.claims.sub,
        reason
      );
      res.json(user);
    } catch (error) {
      console.error("Error updating user level:", error);
      res.status(500).json({ message: "Failed to update user level" });
    }
  });

  // === Invite link endpoints ===
  
  app.get("/api/invites", isAuthenticated, async (req: any, res) => {
    try {
      const links = await storage.getInviteLinksByUser(req.user.claims.sub);
      
      // Add invitee info for used links
      const linksWithDetails = await Promise.all(
        links.map(async (link) => {
          let usedByName: string | undefined;
          if (link.usedByUserId) {
            const usedBy = await storage.getUser(link.usedByUserId);
            usedByName = usedBy ? `${usedBy.firstName || ""} ${usedBy.lastName || ""}`.trim() || usedBy.email || undefined : undefined;
          }
          return { ...link, usedByName };
        })
      );
      
      res.json(linksWithDetails);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.post("/api/invites", isAuthenticated, async (req: any, res) => {
    try {
      const link = await storage.createInviteLink(req.user.claims.sub);
      res.json(link);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite link" });
    }
  });

  // === Promotion request endpoints ===
  
  app.get("/api/promotions", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as "open" | "approved" | "rejected" | "expired" | undefined;
      const requests = await storage.getPromotionRequests(status);
      
      // Get details for each request
      const requestsWithDetails = await Promise.all(
        requests.map(async (r) => storage.getPromotionRequestWithDetails(r.id))
      );
      
      res.json(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.get("/api/promotions/:id", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getPromotionRequestWithDetails(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Promotion request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching promotion:", error);
      res.status(500).json({ message: "Failed to fetch promotion" });
    }
  });

  app.post("/api/promotions", isAuthenticated, requireLevel(4), async (req: any, res) => {
    try {
      const data = insertPromotionRequestSchema.parse({
        candidateUserId: req.body.candidateUserId,
        currentLevel: req.body.currentLevel,
        proposedLevel: req.body.proposedLevel,
        createdByUserId: req.user.claims.sub,
        justification: req.body.justification,
        requiredVotes: req.body.requiredVotes || 3,
        allowedVoterMinLevel: req.body.allowedVoterMinLevel || 4,
      });
      
      const request = await storage.createPromotionRequest(data);
      res.json(request);
    } catch (error) {
      console.error("Error creating promotion:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create promotion request" });
    }
  });

  // === Vote endpoints ===
  
  app.post("/api/promotions/:id/vote", isAuthenticated, requireLevel(4), async (req: any, res) => {
    try {
      const promotionId = req.params.id;
      const userId = req.user.claims.sub;
      const dbUser = req.dbUser;
      
      // Get the promotion to check requirements
      const promotion = await storage.getPromotionRequestWithDetails(promotionId);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion request not found" });
      }
      
      if (promotion.status !== "open") {
        return res.status(400).json({ message: "This promotion is no longer open for voting" });
      }
      
      // Check if user level meets the promotion's required voter level
      if (dbUser.level < promotion.allowedVoterMinLevel) {
        return res.status(403).json({ message: `Level ${promotion.allowedVoterMinLevel}+ required to vote on this promotion` });
      }
      
      // Check if already voted
      const hasVoted = await storage.hasUserVoted(promotionId, userId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted on this promotion" });
      }
      
      // Validate vote data
      const voteData = insertVoteSchema.parse({
        promotionRequestId: promotionId,
        voterUserId: userId,
        vote: req.body.vote,
        comment: req.body.comment,
      });
      
      await storage.createVote(voteData);
      
      // Process votes (check if promotion should be approved)
      const updatedRequest = await storage.processPromotionVotes(promotionId);
      
      res.json({ success: true, promotionStatus: updatedRequest.status });
    } catch (error) {
      console.error("Error voting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // === Stats endpoint ===
  
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allUsers = await storage.getUsersByLevel();
      const myInvites = await storage.getInvitees(userId);
      const openPromotions = await storage.getPromotionRequests("open");
      
      // Count users by level
      const levelCounts = [1, 2, 3, 4, 5].map(level => ({
        level,
        count: allUsers.filter(u => u.level === level).length,
      }));
      
      // Count promotions needing my vote
      const user = await storage.getUser(userId);
      let pendingMyVote = 0;
      if (user && user.level >= 4) {
        for (const promo of openPromotions) {
          const hasVoted = await storage.hasUserVoted(promo.id, userId);
          if (!hasVoted && promo.allowedVoterMinLevel <= user.level) {
            pendingMyVote++;
          }
        }
      }
      
      res.json({
        totalMembers: allUsers.length,
        myInviteCount: myInvites.length,
        pendingPromotions: openPromotions.length,
        pendingMyVote,
        levelDistribution: levelCounts,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
