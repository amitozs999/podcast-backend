import pool from "../db/db";
import express, { Request, Response } from "express";
import { UserInputData } from "#/types/userTypes";
import { CreateUserRequest } from "#/types/userTypes";
import {
  findTokenByOwner,
  compareToken,
  deleteTokenById,
} from "#/services/tokenService"; // Import your helper functions
import { sendForgetPasswordLink } from "#/utils/mail";
import { sendPassResetSuccessEmail } from "#/utils/mail";
import crypto from "crypto";

import { sendVerificationMail } from "#/utils/mail";
import bcrypt from "bcrypt";

import { generateToken } from "#/utils/helper";
import { RequestHandler } from "express";
import { createEmailVerificationToken } from "#/services/tokenService";

import { VerifyEmailRequest } from "../types/userTypes"; // Ensure this type is defined
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "#/utils/variables";
import { PASSWORD_RESET_LINK } from "#/utils/variables";
import formidable from "formidable";
import cloudinary from "#/cloud/indes";

// Define the extended Request type to include files
export interface RequestWithFiles extends Request {
  files?: { [key: string]: formidable.File[] };
}

export const createUser = async (req: CreateUserRequest, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (rows.length > 0) {
      return res.status(403).json({ error: "Email is already in use!" });
    }

    // Hash password before saving to DB
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, hashedPassword]
    );
    const user = await result.rows[0];

    // send verification email
    const token = generateToken();

    // Insert token into database
    // await pool.query(
    //   `INSERT INTO email_verification_tokens (owner, token) VALUES ($1, $2)`,
    //   [user.id, token]
    // );
    const owner = user.id;
    console.log("kk24");

    const x = await createEmailVerificationToken({ owner, token });
    console.log("kk35");

    // Send verification email
    sendVerificationMail(token, { name, email, userId: user.id.toString() });
    console.log("kk46");

    //res.json({ user });

    res.status(201).json({ user, x });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res: Response
) => {
  const { token, userId } = req.body;

  try {
    // Find the verification token
    const verificationToken = await findTokenByOwner(userId);

    if (!verificationToken) {
      return res.status(403).json({ error: "Invalid token!" });
    }

    // Compare the token
    const isTokenValid = await compareToken(verificationToken.token, token);

    if (!isTokenValid) {
      return res.status(403).json({ error: "Invalid token!" });
    }

    // Check if the token has expired
    if (verificationToken.expiry < new Date()) {
      return res.status(403).json({ error: "Token has expired!" });
    }

    // Update the user's verification status
    await pool.query(`UPDATE users SET verified = TRUE WHERE id = $1`, [
      userId,
    ]);

    // Delete the verification token
    await deleteTokenById(verificationToken.id);

    res.json({ message: "Your email is verified." });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).send("Server error");
  }
};

export const sendReVerificationToken: RequestHandler = async (req, res) => {
  const { userId } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(403).json({ error: "Invalid request!" });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(200).json({ message: "User is already verified." });
    }
    // Delete existing token for the user
    await pool.query("DELETE FROM email_verification_tokens WHERE owner = $1", [
      userId,
    ]);

    // Generate a new token
    const token = generateToken();

    // // Insert new token into the database
    // await pool.query(
    //   "INSERT INTO email_verification_tokens (owner, token, expiry) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
    //   [userId, token]
    // );

    const x = await createEmailVerificationToken({ owner: userId, token });

    // Send verification email
    await sendVerificationMail(token, {
      name: user.name,
      email: user.email,
      userId: user.id.toString(),
    });

    res.json({ message: "Please check your mail." + x });
  } catch (err) {
    console.error("Error handling re-verification token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const userResult = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Account not found!" });
    }

    const user = userResult.rows[0];

    // Delete existing password reset token if present
    await pool.query(`DELETE FROM password_reset_tokens WHERE owner = $1`, [
      user.id,
    ]);

    // Generate forgot-password token
    const token = crypto.randomBytes(36).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);

    // Insert the new token into the database
    await pool.query(
      `INSERT INTO password_reset_tokens (owner, token, created_at, expiry) VALUES ($1, $2, NOW(), NOW() + '3 minutes')`,
      [user.id, hashedToken]
    );

    // Create the reset link
    const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user.id}`;

    // Send the reset link to the user
    await sendForgetPasswordLink({ email: user.email, link: resetLink });

    //  // Send verification email
    //  await sendVerificationMail(token, {
    //   name: user.name,
    //   email: user.email,
    //   userId: user.id.toString(),
    // });

    res.json({ message: "Check your registered mail." });
  } catch (err) {
    console.error("Error generating forget password link:", err);
    res.status(500).send("Server error");
  }
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;

  try {
    // Fetch the user record from the database
    const userResult = await pool.query(
      `SELECT id, password, name, email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(403).json({ error: "Unauthorized access!" });
    }

    const user = userResult.rows[0];

    //const hashedCurrPasswordSent = await bcrypt.hash(password, 10);

    // Compare the new password with the current password
    const isCurrentPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (isCurrentPasswordMatched) {
      return res
        .status(422)
        .json({ error: "The new password must be different!" });
    }

    // Hash the new password and update it in the database
    const hashedNewPassword = await bcrypt.hash(password, 10);

    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashedNewPassword,
      userId,
    ]);

    // Delete the password reset token associated with the user
    await pool.query(`DELETE FROM password_reset_tokens WHERE owner = $1`, [
      userId,
    ]);

    // Send the success email
    sendPassResetSuccessEmail(user.name, user.email);

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).send("Server error");
  }
};
export const signIn: RequestHandler = async (req, res) => {
  const { password, email } = req.body;

  try {
    // Fetch the user record from the database
    const userResult = await pool.query(
      `SELECT id, password, name, email, verified,
              COALESCE(favorites, '{}') AS favorites,
              COALESCE(followers, '{}') AS followers,
              COALESCE(followings, '{}') AS followings,
              COALESCE(tokens, '{}') AS tokens
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(403).json({ error: "Email/Password mismatch!" });
    }

    const user = userResult.rows[0];

    // Compare the password
    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.status(403).json({ error: "Email/Password mismatch!" });
    }

    // Generate the token for later use
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    // Update the user's tokens array
    await pool.query(
      `UPDATE users SET tokens = array_append(tokens, $1) WHERE id = $2`,
      [token, user.id]
    );

    // Return the response
    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar_url,
        followers: user.followers.length,
        followings: user.followings.length,
      },
      token,
    });
  } catch (err) {
    console.error("Error signing in:", err);
    res.status(500).send("Server error");
  }
};

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  //const avatar = req.files?.avatar; // Formidable returns an array
  const avatar = req.files?.avatar;

  console.log("avatar", avatar);

  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  const userId = req.user.id;

  // Validate user input
  if (typeof name !== "string")
    return res.status(422).json({ error: "Invalid name!" });

  if (name.trim().length < 3)
    return res.status(422).json({ error: "Invalid name!" });

  try {
    // Update user name
    await pool.query(`UPDATE users SET name = $1 WHERE id = $2`, [
      name,
      userId,
    ]);

    if (avatar) {
      // Retrieve current user's avatar info
      const {
        rows: [user],
      } = await pool.query(
        `SELECT avatar->>'publicId' AS publicId FROM users WHERE id = $1`,
        [userId]
      );

      if (user.publicId) {
        // Remove the old avatar from Cloudinary
        await cloudinary.uploader.destroy(user.publicId);
      }

      // Upload new avatar to Cloudinary
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        avatar.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );

      // Update user with new avatar info
      await pool.query(`UPDATE users SET avatar = $1 WHERE id = $2`, [
        JSON.stringify({ url: secure_url, publicId: public_id }),
        userId,
      ]);
    }

    // Fetch updated user profile
    const {
      rows: [updatedUser],
    } = await pool.query(
      `SELECT id, name, email, avatar FROM users WHERE id = $1`,
      [userId]
    );

    res.json({ profile: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logOut: RequestHandler = async (req, res) => {
  const { fromAll } = req.query;
  const token = req.token;
  const userId = req.user.id;

  try {
    // Fetch user from the database
    const { rows } = await pool.query(
      "SELECT tokens FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found!" });
    }

    let tokens = rows[0].tokens as string[];

    if (fromAll === "yes") {
      // Logout from all devices by clearing tokens
      tokens = [];
    } else {
      // Remove the specific token from the array
      tokens = tokens.filter((t) => t !== token);
    }

    // Update the tokens array in the database
    await pool.query("UPDATE users SET tokens = $1 WHERE id = $2", [
      tokens,
      userId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Server error" });
  }
};
