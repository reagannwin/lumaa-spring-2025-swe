import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable ${name}. See backend/.env.example.`);
    }
    return value;
};

export const config = {
    port: Number(process.env.PORT) || 5000,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
    // Either a single DATABASE_URL or the individual DB_* variables.
    database: process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
              host: process.env.DB_HOST || "localhost",
              port: Number(process.env.DB_PORT) || 5432,
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME,
          },
};
