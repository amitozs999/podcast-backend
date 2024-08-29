import { RequestHandler } from "express";

import pool from "#/db/db";

export const toggleFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.audioId as string;
  let status: "added" | "removed";

  try {
    // Check if the audio exists
    const audioResult = await pool.query(
      "SELECT id, favorites_count FROM audios WHERE id = $1",
      [audioId]
    );

    if (audioResult.rowCount === 0) {
      return res.status(404).json({ error: "Resource not found!" });
    }

    const userId = req.user.id;
    const { favorites_count } = audioResult.rows[0];

    // Check if the audio is already favourited by the user
    const favoriteCheckResult = await pool.query(
      "SELECT 1 FROM audio_favourite WHERE user_id = $1 AND audio_id = $2",
      [userId, audioId]
    );

    const isFavorite = favoriteCheckResult.rowCount ?? 0;

    if (isFavorite > 0) {
      // Audio is already favourited, so remove it
      await pool.query(
        "DELETE FROM audio_favourite WHERE user_id = $1 AND audio_id = $2",
        [userId, audioId]
      );

      // Decrement the favorites_count
      await pool.query("UPDATE audios SET favorites_count = $1 WHERE id = $2", [
        favorites_count - 1,
        audioId,
      ]);
      status = "removed";
    } else {
      // Add the audio to favorites
      await pool.query(
        "INSERT INTO audio_favourite (user_id, audio_id) VALUES ($1, $2)",
        [userId, audioId]
      );

      // Increment the favorites_count
      await pool.query("UPDATE audios SET favorites_count = $1 WHERE id = $2", [
        favorites_count + 1,
        audioId,
      ]);

      status = "added";
    }

    res.json({ status });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFavorites: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const offset = parseInt(pageNo) * parseInt(limit);
  const limitInt = parseInt(limit);

  try {
    //if you only need information about the favorite audios themselves and do not need details
    //about the audio owners
    //or other related user information, then joining the users table is not strictly necessary.

    // Get all favorite audios for the user
    const favoritesResult = await pool.query(
      `SELECT a.id, a.title, a.category, a.file_url, a.poster_url, u.name AS owner_name, a.owner AS owner_id
         FROM audio_favourite f
         JOIN audios a ON f.audio_id = a.id
         JOIN users u ON a.owner = u.id
         WHERE f.user_id = $1
         LIMIT $2 OFFSET $3`,
      [userId, limitInt, offset]
    );

    // Map results to the desired format
    const audios = favoritesResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      file: row.file_url,
      poster: row.poster_url,
      owner: { name: row.owner_name, id: row.owner_id },
    }));

    res.json({ audios });
  } catch (error) {
    console.error("Error getting favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkIsFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.audioId as string;

  try {
    const userId = req.user.id;

    // Check if the audio is in favorites
    const favoriteCheckResult = await pool.query(
      "SELECT 1 FROM audio_favourite WHERE user_id = $1 AND audio_id = $2",
      [userId, audioId]
    );

    const isFavorite = favoriteCheckResult.rowCount ?? 0;
    res.json({ result: isFavorite > 0 });
  } catch (error) {
    console.error("Error checking if favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
