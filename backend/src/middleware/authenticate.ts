import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

interface TokenPayload {
    userId: number;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as TokenPayload;
        if (typeof payload.userId !== "number") {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

/** For handlers behind `authenticate`, where userId is always set. */
export const requireUserId = (req: Request): number => {
    if (req.userId === undefined) {
        throw new Error("requireUserId called on a route without authenticate middleware");
    }
    return req.userId;
};

export default authenticate;
