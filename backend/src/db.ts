import { Pool } from "pg";
import { config } from "./config";

// One shared connection pool for the whole app.
const pool = new Pool(config.database);

export default pool;
