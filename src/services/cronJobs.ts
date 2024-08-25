import cron from "node-cron";
import pool from "../db/db"; // Adjust the path to your database pool

// Schedule a task to run every hour
cron.schedule("*/2 * * * *", async () => {
  console.log("Running scheduled job to delete expired tokens...");

  try {
    await pool.query(`
      DELETE FROM email_verification_tokens
      WHERE expiry < NOW();
    `);
    await pool.query(`
      DELETE FROM password_reset_tokens
      WHERE expiry < NOW();
    `);

    console.log(
      "Expired email_verification_tokens and  password_reset_tokens deleted successfully."
    );
  } catch (err) {
    console.error("Error executing job:", err);
  }
});
