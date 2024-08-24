import pool from "../db/db";
import express, { Request, Response } from "express";

import { UserData } from "#/types/userTypes";
import { CreateUserRequest } from "#/types/userTypes";

// export const createUser = async (userData: UserData) => {
//   const { name, email, password } = userData;
//   const result = await pool.query(
//     `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
//     [name, email, password]
//   );
//   return result.rows[0];
// };

export const createUser = async (req: CreateUserRequest, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, password]
    );
    const user = await result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};
