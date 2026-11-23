import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models/User";
import { validateCredentials } from "../validation";

const UNIQUE_VIOLATION = "23505";

// Compared against when the username doesn't exist, so a missing user and a
// wrong password take about the same time and can't be told apart.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", config.bcryptRounds);

export const register = async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    const error = validateCredentials(username, password);
    if (error) return res.status(400).json({ message: error });

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    try {
        const user = await UserModel.create(username.trim(), passwordHash);
        return res.status(201).json(user);
    } catch (err) {
        if ((err as { code?: string }).code === UNIQUE_VIOLATION) {
            return res.status(409).json({ message: "Username is already taken" });
        }
        throw err;
    }
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await UserModel.findByUsername(username.trim());
    const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !passwordMatches) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
        algorithm: "HS256",
    });

    return res.json({ token, user: { id: user.id, username: user.username } });
};
