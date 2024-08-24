import pool from "../db/db";
import express, { Request, Response } from "express";
import { UserInputData } from "#/types/userTypes";
import { CreateUserRequest } from "#/types/userTypes";
import {
  findTokenByOwner,
  compareToken,
  deleteTokenById,
} from "#/services/tokenService"; // Import your helper functions

import { sendVerificationMail } from "#/utils/mail";

import { generateToken } from "#/utils/helper";
import { RequestHandler } from "express";
import { createEmailVerificationToken } from "#/services/tokenService";

import { VerifyEmailRequest } from "../types/userTypes"; // Ensure this type is defined

export const createUser = async (req: CreateUserRequest, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, password]
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

export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};
