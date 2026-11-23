// Runs before each test file, before the app's config is loaded.
// Tests use their own database so they never touch your dev data.
process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || "postgres://taskapp:taskapp@localhost:5432/taskmanager_test";
process.env.JWT_SECRET = "test-secret-not-used-anywhere-else";
process.env.BCRYPT_ROUNDS = "4"; // fast hashing for tests
