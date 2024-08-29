import { isVerified, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";

import pool from "#/db/db";
import { RequestHandler } from "express";

export const createPlaylist: RequestHandler = async (req, res) => {
  const { title, resId, visibility } = req.body;
  const ownerId = req.user.id;

  //console.log("enterd" + title + resId + visibility);

  let client;
  try {
    client = await pool.connect();

    // Check if the audio exists (if resId is provided)
    if (resId) {
      const audioResult = await client.query(
        "SELECT 1 FROM audios WHERE id = $1",
        [resId]
      );
      if (audioResult.rowCount === 0) {
        return res.status(404).json({ error: "Could not find the audio!" });
      }

      //console.log("enterd2");
    }

    //console.log("enterd3");

    // Insert new playlist and return the generated ID
    const result = await client.query(
      "INSERT INTO playlists (title, owner, visibility) VALUES ($1, $2, $3) RETURNING id",
      [title, ownerId, visibility]
    );
    const playlistId = result.rows[0].id;

    //console.log("enterd4");

    // Add audio to playlist if resId is provided
    if (resId) {
      //console.log("enterd51");

      await client.query(
        "INSERT INTO playlist_audio_items (playlist_id, audio_id) VALUES ($1, $2)",
        [playlistId, resId]
      );
      //console.log("enterd5");
    }

    res.status(201).json({
      playlist: {
        id: playlistId,
        title,
        visibility,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export const updatePlaylist: RequestHandler = async (req, res) => {
  const { id, item, title, visibility } = req.body; //audioitem

  const userId = req.user.id;

  let client;
  try {
    client = await pool.connect();

    // Update playlist details
    const result = await client.query(
      "UPDATE playlists SET title = $1, visibility = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND owner = $4 RETURNING *",
      [title, visibility, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Playlist not found!" });
    }

    // map audio to playlist if audioitem is provided
    if (item) {
      const audioResult = await client.query(
        "SELECT 1 FROM audios WHERE id = $1",
        [item]
      );
      if (audioResult.rowCount === 0) {
        return res.status(404).json({ error: "Audio not found!" });
      }

      await client.query(
        "INSERT INTO playlist_audio_items (playlist_id, audio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, item]
      );
    }

    res.status(201).json({
      playlist: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export const removePlaylist: RequestHandler = async (req, res) => {
  const { playlistId, resId, all } = req.query;
  const userId = req.user.id;

  let client;
  try {
    client = await pool.connect();

    if (all === "yes") {
      // Delete entire playlist
      await client.query("DELETE FROM playlists WHERE id = $1 AND owner = $2", [
        playlistId,
        userId,
      ]);
    } else if (resId) {
      // Remove specific audio from playlist
      await client.query(
        "DELETE FROM playlist_audio_items WHERE playlist_id = $1 AND audio_id = $2",
        [playlistId, resId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export const getPlaylistByProfile: RequestHandler = async (req, res) => {
  const { pageNo = "0", limit = "20" } = req.query as {
    pageNo: string;
    limit: string;
  };
  const userId = req.user.id;

  let client;
  try {
    client = await pool.connect();

    //visibility != 'auto': Excludes playlists where the visibility is 'auto'. Only playlists with 'public' or 'private' visibility are included.
    //LIMIT $2: Limits the number of results returned by the query
    //OFFSET $3: Skips the number of results specified by $3 which is calculated based on the pageNo and limit

    const playlistsResult = await client.query(
      `SELECT id, title, visibility, 
      (SELECT COUNT(*) FROM playlist_audio_items WHERE playlist_id = playlists.id) AS audio_items_count
       FROM playlists WHERE owner = $1 AND visibility != 'auto' 
       ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(pageNo) * parseInt(limit)]
    );

    res.json({
      playlist: playlistsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export const getPlaylistAudios: RequestHandler = async (req, res) => {
  const { playlistId } = req.params;
  //const userId = req.user.id;

  console.log("Received playlistId:", playlistId); // Debugging

  let client;
  try {
    client = await pool.connect();

    // Validate playlist
    const playlistResult = await client.query(
      "SELECT id, title FROM playlists WHERE id = $1 AND visibility !=`private`  ",
      [playlistId]
    );

    if (playlistResult.rowCount === 0) {
      // If no playlist found, try the auto-generated playlists

      const autoplaylistResult = await client.query(
        "SELECT id, title FROM auto_generated_playlists WHERE id = $1",
        [playlistId]
      );

      if (autoplaylistResult.rowCount === 0) {
        return res.status(404).json({ error: "Playlist not found!" });
      }

      // Get audios in playlist
      const audiosResult = await client.query(
        `SELECT a.id, a.title, a.category, a.file_url, a.poster_url, u.name AS owner_name, u.id AS owner_id 
        FROM auto_generated_playlist_audio_items  pi 
        JOIN audios a ON pi.audio_id = a.id 
        JOIN users u ON a.owner = u.id 
        WHERE pi.playlist_id = $1`,
        [playlistId]
      );

      res.json({
        list: {
          id: playlistId,
          title: playlistResult.rows[0].title,
          audios: audiosResult.rows,
        },
      });
    }

    // Get audios in playlist
    const audiosResult = await client.query(
      `SELECT a.id, a.title, a.category, a.file_url, a.poster_url, u.name AS owner_name, u.id AS owner_id 
      FROM playlist_audio_items pi 
      JOIN audios a ON pi.audio_id = a.id 
      JOIN users u ON a.owner = u.id 
      WHERE pi.playlist_id = $1`,
      [playlistId]
    );

    res.json({
      list: {
        id: playlistId,
        title: playlistResult.rows[0].title,
        audios: audiosResult.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export const getCurrentUserPlaylistAudios: RequestHandler = async (
  req,
  res
) => {
  const { playlistId } = req.params;
  const userId = req.user.id;

  console.log("Received playlistId:", playlistId); // Debugging

  let client;
  try {
    client = await pool.connect();

    // Validate playlist
    const playlistResult = await client.query(
      "SELECT id, title FROM playlists WHERE id = $1 AND owner = $2",
      [playlistId, userId]
    );

    if (playlistResult.rowCount === 0) {
      // If no playlist found, try the auto-generated playlists

      const autoplaylistResult = await client.query(
        "SELECT id, title FROM auto_generated_playlists WHERE id = $1",
        [playlistId]
      );

      if (autoplaylistResult.rowCount === 0) {
        return res.status(404).json({ error: "Playlist not found!" });
      }

      // Get audios in playlist
      const audiosResult = await client.query(
        `SELECT a.id, a.title, a.category, a.file_url, a.poster_url, u.name AS owner_name, u.id AS owner_id 
          FROM auto_generated_playlist_audio_items  pi 
          JOIN audios a ON pi.audio_id = a.id 
          JOIN users u ON a.owner = u.id 
          WHERE pi.playlist_id = $1`,
        [playlistId]
      );

      res.json({
        list: {
          id: playlistId,
          title: playlistResult.rows[0].title,
          audios: audiosResult.rows,
        },
      });
    }

    // Get audios in playlist
    const audiosResult = await client.query(
      `SELECT a.id, a.title, a.category, a.file_url, a.poster_url, u.name AS owner_name, u.id AS owner_id 
        FROM playlist_audio_items pi 
        JOIN audios a ON pi.audio_id = a.id 
        JOIN users u ON a.owner = u.id 
        WHERE pi.playlist_id = $1`,
      [playlistId]
    );

    res.json({
      list: {
        id: playlistId,
        title: playlistResult.rows[0].title,
        audios: audiosResult.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};
