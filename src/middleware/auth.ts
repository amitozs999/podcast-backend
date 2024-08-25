import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import pool from "../db/db"; // Ensure you have PostgreSQL pool configured

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  const { token, userId } = req.body;

  try {
    // Find the password reset token for the given userId
    const result = await pool.query(
      `SELECT token FROM password_reset_tokens WHERE owner = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Unauthorized access, invalid token!1" });
    }

    const resetToken = result.rows[0].token;

    console.log(resetToken);
    console.log(token);

    // Compare the provided token with the stored token
    const matched = await bcrypt.compare(token, resetToken);

    if (!matched) {
      return res
        .status(403)
        .json({ error: "Unauthorized access, invalid token!2" });
    }

    next();
  } catch (err) {
    console.error("Error validating password reset token:", err);
    res.status(500).send("Server error");
  }
};
