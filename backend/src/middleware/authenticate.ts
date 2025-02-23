import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        (req as any).userId = (decoded as any).userId;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token" });
    }
};

export default authenticate;