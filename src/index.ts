import express from "express";
import fs from "fs";
import path from "path";
import "dotenv/config";
import "./db/db.ts";
import { execSync } from "child_process";

import pool from "./db/db";
import authRouter from "./routers/authRouter";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);

const PORT = process.env.PORT || 8989;

// Test PostgreSQL connection
async function testDatabaseConnection() {
  try {
    // Perform a simple query to test connection
    const result = await pool.query("SELECT NOW()");
    console.log("Database connection successful!");
    console.log("Current time from database:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Execute schema setup before testing the database connection
  //The src/migration/index.ts script reads schema.sql and applies it to the database.
  // execSync to run the migration script synchronously before starting the server.

  try {
    execSync("npx ts-node src/migrations/index.ts", { stdio: "inherit" });
  } catch (error) {
    console.error("Failed to execute migration script:", error);
    process.exit(1); // Exit if migration fails
  }

  await testDatabaseConnection(); // Test connection after server starts
});
