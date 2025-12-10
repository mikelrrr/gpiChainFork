import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireLevel, completeRegistration } from "./replitAuth";
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
        inviterName: inviter ? inviter.username : "Unknown",
      });
    } catch (error) {
      console.error("Error validating invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  // Check pending registration status (requires session but not full auth since user may not be created yet)
  app.get("/api/auth/pending-registration", (req: any, res) => {
    // Only return pending info if there is an authenticated session
    if (!req.session) {
      return res.status(401).json({ message: "No session" });
    }
    
    const pending = req.session?.pendingRegistration;
    if (!pending) {
      return res.json({ pending: false });
    }
    res.json({
      pending: true,
      isFirstUser: pending.isFirstUser,
      firstName: pending.claims?.first_name,
      lastName: pending.claims?.last_name,
    });
  });

  // Complete registration with username
  app.post("/api/auth/complete-registration", async (req: any, res) => {
    try {
      const pending = req.session?.pendingRegistration;
      if (!pending) {
        return res.status(400).json({ message: "No pending registration" });
      }

      const { username } = req.body;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Username is required" });
      }

      const result = await completeRegistration(pending, username);
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      // Clear pending registration
      delete req.session.pendingRegistration;

      res.json({ success: true, user: result.user });
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });

  // Check username availability
  app.get("/api/username/check/:username", async (req, res) => {
    try {
      const username = req.params.username.toLowerCase().trim();
      
      // Validate format
      if (username.length < 3 || username.length > 30) {
        return res.json({ available: false, reason: "Username must be 3-30 characters" });
      }
      if (!/^[a-z0-9_]+$/.test(username)) {
        return res.json({ available: false, reason: "Username can only contain letters, numbers, and underscores" });
      }
      
      const available = await storage.isUsernameAvailable(username);
      res.json({ available, reason: available ? null : "Username is already taken" });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  // Update username (self or Level 5 can edit others)
  app.patch("/api/users/:userId/username", isAuthenticated, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const { username } = req.body;

      // Get current user
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check permissions: self-edit or Level 5
      const isSelf = targetUserId === currentUserId;
      const isLevel5 = currentUser.level === 5;
      
      if (!isSelf && !isLevel5) {
        return res.status(403).json({ message: "Only Level 5 members can edit other users' usernames" });
      }

      // Validate username
      const normalizedUsername = username.toLowerCase().trim();
      if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
        return res.status(400).json({ message: "Username must be 3-30 characters" });
      }
      if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
      }

      // Check availability (excluding target user's current username)
      const available = await storage.isUsernameAvailable(normalizedUsername, targetUserId);
      if (!available) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      const updatedUser = await storage.updateUsername(targetUserId, normalizedUsername);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
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

  // Direct level change (Level 5 only, non-Level-5 targets)
  app.post("/api/users/:id/level", isAuthenticated, requireLevel(5), async (req: any, res) => {
    try {
      const { newLevel, reason } = req.body;
      if (!newLevel || !reason) {
        return res.status(400).json({ message: "newLevel and reason are required" });
      }
      
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Cannot directly change Level 5 users (must use governance process)
      if (targetUser.level === 5 && newLevel !== 5) {
        return res.status(400).json({ message: "Level 5 demotions require the governance voting process" });
      }
      if (newLevel === 5 && targetUser.level !== 5) {
        return res.status(400).json({ message: "Level 5 promotions require the governance voting process" });
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

  // Level 5 governance info endpoint
  app.get("/api/level5-governance", isAuthenticated, async (req: any, res) => {
    try {
      const level5Count = await storage.countLevel5Users();
      const voteThreshold = await storage.getLevel5VoteThreshold();
      const canBootstrap = await storage.canBootstrapPromoteToLevel5();
      
      res.json({
        level5Count,
        voteThreshold,
        canBootstrap,
        rules: {
          description: canBootstrap 
            ? "As the only Level 5, you can directly promote 1 user to Level 5 without voting."
            : level5Count === 2
              ? "With 2 Level 5 members, Level 5 changes require unanimous 2 votes."
              : "With 3+ Level 5 members, Level 5 changes require 3 votes.",
        }
      });
    } catch (error) {
      console.error("Error fetching governance info:", error);
      res.status(500).json({ message: "Failed to fetch governance info" });
    }
  });

  // Bootstrap direct promotion to Level 5 (only when there's exactly 1 Level 5)
  app.post("/api/level5-governance/bootstrap-promote", isAuthenticated, requireLevel(5), async (req: any, res) => {
    try {
      const { candidateUserId, reason } = req.body;
      if (!candidateUserId || !reason) {
        return res.status(400).json({ message: "candidateUserId and reason are required" });
      }
      
      const canBootstrap = await storage.canBootstrapPromoteToLevel5();
      if (!canBootstrap) {
        return res.status(400).json({ message: "Bootstrap promotion is only available when there is exactly 1 Level 5 member" });
      }
      
      const candidate = await storage.getUser(candidateUserId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      if (candidate.level === 5) {
        return res.status(400).json({ message: "User is already Level 5" });
      }
      
      const user = await storage.updateUserLevel(
        candidateUserId,
        5,
        req.user.claims.sub,
        `Bootstrap promotion to Level 5: ${reason}`
      );
      res.json(user);
    } catch (error) {
      console.error("Error bootstrap promoting:", error);
      res.status(500).json({ message: "Failed to bootstrap promote to Level 5" });
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
      const requestType = req.body.requestType || "PROMOTE";
      const dbUser = req.dbUser;
      
      // Level 5 governance requests require Level 5
      if ((requestType === "PROMOTE_TO_5" || requestType === "DEMOTE_FROM_5") && dbUser.level < 5) {
        return res.status(403).json({ message: "Only Level 5 members can create Level 5 governance requests" });
      }
      
      // Check if bootstrap should be used instead
      if (requestType === "PROMOTE_TO_5") {
        const canBootstrap = await storage.canBootstrapPromoteToLevel5();
        if (canBootstrap) {
          return res.status(400).json({ message: "Use bootstrap promotion when there is only 1 Level 5 member" });
        }
      }
      
      // Cannot demote last Level 5
      if (requestType === "DEMOTE_FROM_5") {
        const canDemote = await storage.canDemoteFromLevel5(req.body.candidateUserId);
        if (!canDemote) {
          return res.status(400).json({ message: "Cannot demote the last remaining Level 5 member" });
        }
      }
      
      // Get vote threshold for Level 5 governance
      let requiredVotes = req.body.requiredVotes || 3;
      let allowedVoterMinLevel = req.body.allowedVoterMinLevel || 4;
      
      if (requestType === "PROMOTE_TO_5" || requestType === "DEMOTE_FROM_5") {
        requiredVotes = await storage.getLevel5VoteThreshold();
        allowedVoterMinLevel = 5; // Only Level 5 can vote on Level 5 governance
      }
      
      const data = insertPromotionRequestSchema.parse({
        candidateUserId: req.body.candidateUserId,
        currentLevel: req.body.currentLevel,
        proposedLevel: req.body.proposedLevel,
        createdByUserId: req.user.claims.sub,
        justification: req.body.justification,
        requestType,
        requiredVotes,
        allowedVoterMinLevel,
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
