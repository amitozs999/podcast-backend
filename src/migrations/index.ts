import fs from "fs";
import path from "path";
import pool from "../db/db"; // Adjust path if needed

// Function to execute schema SQL file
async function executeSchema() {
  const sqlFilePath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf8");

  try {
    await pool.query(sql);
    console.log("Database schema applied successfully!");
  } catch (error) {
    console.error("Error applying schema:", error);
  }
}

// Run schema setup
executeSchema()
  .then(() => {
    process.exit(0); // Exit after executing schema
  })
  .catch((error) => {
    console.error("Failed to execute schema:", error);
    process.exit(1); // Exit with error code
  });
