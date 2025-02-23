import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Backend is running!");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});