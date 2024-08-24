// src/db/db.ts
import { Pool } from "pg";
import { DB_CONFIG } from "../config/config"; // Import your DB configuration

// Create and configure a new Pool instance
const pool = new Pool(DB_CONFIG);

// Export the pool for use in other parts of the application
export default pool;
