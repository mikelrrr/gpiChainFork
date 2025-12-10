import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    const replId = process.env.REPL_ID;
    if (!replId) {
      throw new Error("REPL_ID environment variable is required for authentication. Please add REPL_ID to your deployment secrets.");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      replId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required. Please add DATABASE_URL to your deployment secrets.");
  }
  
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required. Please add SESSION_SECRET to your deployment secrets.");
  }
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

interface PendingRegistration {
  claims: any;
  inviteToken?: string;
  invitedByUserId?: string;
  isFirstUser: boolean;
}

async function checkUserRegistration(claims: any, inviteToken?: string): Promise<{ user: any, pending?: PendingRegistration, error?: string }> {
  // Check if this is the first user (becomes Level 5 admin)
  const userCount = await storage.getUserCount();
  const isFirstUser = userCount === 0;

  // Check if user already exists
  const existingUser = await storage.getUser(claims["sub"]);
  
  if (existingUser) {
    // Just update profile info for existing user
    const user = await storage.upsertUser({
      id: claims["sub"],
      username: existingUser.username,
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
    return { user };
  }

  // New user registration - require invite unless first user
  if (!isFirstUser && !inviteToken) {
    return { user: null, error: "Invite token required for registration" };
  }

  // Validate invite link for new users (not first user)
  let invitedByUserId: string | undefined;
  if (inviteToken && !isFirstUser) {
    const inviteLink = await storage.getInviteLinkByToken(inviteToken);
    if (!inviteLink) {
      return { user: null, error: "Invalid invite token" };
    }
    if (inviteLink.status !== "active") {
      return { user: null, error: "Invite link has expired or been used" };
    }
    if (inviteLink.maxUses && inviteLink.usesCount >= inviteLink.maxUses) {
      return { user: null, error: "Invite link has reached maximum uses" };
    }
    invitedByUserId = inviteLink.invitedByUserId;
  }

  // Return pending registration - user needs to choose username
  return {
    user: null,
    pending: {
      claims,
      inviteToken,
      invitedByUserId,
      isFirstUser,
    }
  };
}

export async function completeRegistration(pendingReg: PendingRegistration, username: string): Promise<{ user: any, error?: string }> {
  const claims = pendingReg.claims;
  
  // Validate username
  const normalizedUsername = username.toLowerCase().trim();
  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    return { user: null, error: "Username must be 3-30 characters" };
  }
  if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
    return { user: null, error: "Username can only contain letters, numbers, and underscores" };
  }
  
  // Check username availability
  const isAvailable = await storage.isUsernameAvailable(normalizedUsername);
  if (!isAvailable) {
    return { user: null, error: "Username is already taken" };
  }

  // Create new user with username
  const user = await storage.upsertUser({
    id: claims["sub"],
    username: normalizedUsername,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    level: pendingReg.isFirstUser ? 5 : 1,
    invitedByUserId: pendingReg.invitedByUserId,
    agreementAcceptedAt: new Date(),
    agreementVersion: 1,
  });

  // Mark invite link as used if applicable
  if (pendingReg.inviteToken && pendingReg.invitedByUserId) {
    try {
      await storage.useInviteLink(pendingReg.inviteToken, user.id);
    } catch (e) {
      console.error("Failed to mark invite as used:", e);
    }
  }

  return { user };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    // Note: actual user upsert happens in callback with invite token
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Store invite token in session for callback
    const inviteToken = req.query.invite as string;
    if (inviteToken) {
      (req.session as any).inviteToken = inviteToken;
    }
    
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.redirect("/api/login");

      // Get invite token from session
      const inviteToken = (req.session as any).inviteToken;
      delete (req.session as any).inviteToken;

      // Check registration status
      const result = await checkUserRegistration(user.claims, inviteToken);
      
      if (result.error) {
        // Registration failed - redirect with error
        return res.redirect(`/?error=${encodeURIComponent(result.error)}`);
      }

      if (result.pending) {
        // New user needs to choose username - store pending registration in session
        (req.session as any).pendingRegistration = result.pending;
        req.logIn(user, (err) => {
          if (err) return next(err);
          res.redirect("/?register=pending");
        });
        return;
      }

      req.logIn(user, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to check minimum level requirement
export const requireLevel = (minLevel: number): RequestHandler => {
  return async (req, res, next) => {
    const user = req.user as any;
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.level < minLevel) {
      return res.status(403).json({ message: `Level ${minLevel}+ required` });
    }

    (req as any).dbUser = dbUser;
    next();
  };
};
