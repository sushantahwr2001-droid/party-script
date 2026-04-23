import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.PARTY_SCRIPT_JWT_SECRET ?? "party-script-dev-secret";

export interface AuthTokenPayload {
  userId: string;
  organizationId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function createToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    request.auth = verifyToken(token);
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token." });
  }
}
