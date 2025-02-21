const { Pool } = require("pg");

// Create a new connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Ensure this is in your .env file
});

module.exports = pool;
