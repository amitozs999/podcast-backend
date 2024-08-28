import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import pool from "../db/db"; // Ensure you have PostgreSQL pool configured
import { verify, JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "#/utils/variables";
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

export const mustAuth: RequestHandler = async (req, res, next) => {
  console.log("mustauthhit");

  const { authorization } = req.headers;

  const token = authorization?.split("Bearer ")[1];

  if (!token) return res.status(403).json({ error: "Unauthorized request!1" });

  try {
    // Verify the JWT token
    const payload = verify(token, JWT_SECRET) as JwtPayload;
    const userId = payload.userId;

    // Fetch the user and check if the token is present in the user's tokens array
    const result = await pool.query(
      `SELECT id, name, email, verified, avatar, followers, followings, tokens
         FROM users
         WHERE id = $1 AND $2 = ANY(tokens)`,
      [userId, token]
    );

    const user = result.rows[0];
    if (!user) return res.status(403).json({ error: "Unauthorized request!2" });

    console.log("user", user);

    // Attach user information to the request object
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar,
      followers: user.followers ? user.followers.length : 0,
      followings: user.followings ? user.followings.length : 0,
    };
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ error: "Unauthorized request!3" });
  }
};

export const isVerified: RequestHandler = (req, res, next) => {
  if (!req.user.verified)
    return res.status(403).json({ error: "Please verify your email account!" });

  next();
};
