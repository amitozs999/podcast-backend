import express from "express";
import "express-async-errors";

import fs from "fs";
import path from "path";
import "dotenv/config";
import "./db/db.ts";
import { execSync } from "child_process";
import pool from "./db/db";
import authRouter from "./routers/authRouter";
import audioRouter from "./routers/audioRouter";
import favoriteRouter from "./routers/favoriteRouter";
import playlistRouter from "./routers/playlistRouter";
import profileRouter from "./routers/profileRouter";
import historyRouter from "./routers/historyRouter";
import { errorHandler } from "./middleware/errorMiddleware";
import "./services/cronJobs"; // Import the cron jobs setup

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("src/public"));

app.use("/auth", authRouter);
app.use("/audio", audioRouter);
app.use("/favorite", favoriteRouter);
app.use("/playlist", playlistRouter);
app.use("/profile", profileRouter);
app.use("/history", historyRouter);
// Use error-handling middleware
app.use(errorHandler);

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

  // Schedule a task using node-cron  Every 3 minutes.
});
