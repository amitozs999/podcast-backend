// src/db/db.ts
import { Pool } from "pg";
import { DB_CONFIG } from "../config/config"; // Import your DB configuration

// Create and configure a new Pool instance
const pool = new Pool(DB_CONFIG);

// // Gracefully handle process exit
// process.on("SIGINT", () => {
//   console.log("Process interrupted. Closing PostgreSQL connection pool...");
//   pool.end(() => {
//     console.log("PostgreSQL connection pool closed");
//     process.exit(0);
//   });
// });

// Export the pool for use in other parts of the application
export default pool;
