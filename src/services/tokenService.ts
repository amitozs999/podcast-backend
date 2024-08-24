import pool from "../db/db";
import bcrypt from "bcrypt";
import {
  EmailVerificationToken,
  CreateEmailVerificationTokenInput,
} from "../types/userTypes";

// Create a new email verification token
export const createEmailVerificationToken = async (
  data: CreateEmailVerificationTokenInput
): Promise<EmailVerificationToken> => {
  const { owner, token } = data;
  const hashedToken = await bcrypt.hash(token, 10);

  const result = await pool.query(
    `INSERT INTO email_verification_tokens (owner, token, created_at, expiry) 
    VALUES ($1, $2, NOW(), NOW() + '3 minutes') 
    RETURNING *`,
    [owner, hashedToken]
  );

  return result.rows[0];
};

// Find a token by owner
export const findTokenByOwner = async (
  owner: number
): Promise<EmailVerificationToken | null> => {
  const result = await pool.query(
    `SELECT * FROM email_verification_tokens WHERE owner = $1`,
    [owner]
  );
  return result.rows[0] || null;
};

// Compare provided token with the stored hashed token
export const compareToken = async (
  storedToken: string,
  providedToken: string
): Promise<boolean> => {
  return bcrypt.compare(providedToken, storedToken);
};

// Delete token by ID
export const deleteTokenById = async (id: number): Promise<void> => {
  await pool.query(`DELETE FROM email_verification_tokens WHERE id = $1`, [id]);
};
