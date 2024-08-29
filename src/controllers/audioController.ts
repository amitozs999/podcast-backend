import formidable from "formidable";
import cloudinary from "#/cloud/indes";

import { RequestWithFiles } from "#/middleware/fileParser";
import { RequestHandler } from "express";
import pool from "#/db/db";

export type categoriesTypes =
  | "Arts"
  | "Business"
  | "Education"
  | "Entertainment"
  | "Kids & Family"
  | "Music"
  | "Science"
  | "Tech"
  | "Others";

interface CreateAudioRequest extends RequestWithFiles {
  body: {
    title: string;
    about: string;
    category: categoriesTypes;
  };
}

export const createAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res
) => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const audioFile = req.files?.file as formidable.File;
  const ownerId = req.user.id;

  if (!audioFile)
    return res.status(422).json({ error: "Audio file is missing!" });

  try {
    // Upload audio file to Cloudinary
    const audioRes = await cloudinary.uploader.upload(audioFile.filepath, {
      resource_type: "video",
    });

    let posterUrl = null;
    let posterPublicId = null;

    if (poster) {
      // Upload poster file to Cloudinary
      const posterRes = await cloudinary.uploader.upload(poster.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });
      posterUrl = posterRes.secure_url;
      posterPublicId = posterRes.public_id;
    }

    // Insert new audio record into PostgreSQL
    const result = await pool.query(
      `INSERT INTO audios (title, about, owner, file_url, file_public_id, poster_url, poster_public_id, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
      [
        title,
        about,
        ownerId,
        audioRes.secure_url,
        audioRes.public_id,
        posterUrl,
        posterPublicId,
        category || "Others", // Default to 'Others' if not provided
      ]
    );

    const audioId = result.rows[0].id;

    res.status(201).json({
      audio: {
        id: audioId,
        title,
        about,
        file: audioRes.secure_url,
        poster: posterUrl,
      },
    });
  } catch (error) {
    console.error("Error creating audio:", error);
    res.status(500).json({ error: "An error occurred while creating audio." });
  }
};

export const updateAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res
) => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const ownerId = req.user.id;
  const { audioId } = req.params;

  console.log(req.body);

  try {
    // Check if the audio exists
    const audioResult = await pool.query(
      "SELECT * FROM audios WHERE id = $1 AND owner = $2",
      [audioId, ownerId]
    );

    if (audioResult.rows.length === 0) {
      return res.status(404).json({ error: "Record not found!" });
    }

    const audio = audioResult.rows[0];

    // Update the audio record
    await pool.query(
      `UPDATE audios
         SET title = COALESCE($1, title),
             about = COALESCE($2, about),
             category = COALESCE($3, category),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
      [title, about, category, audioId]
    );

    // Handle poster update
    if (poster) {
      if (audio.poster_public_id) {
        // Delete old poster from Cloudinary
        await cloudinary.uploader.destroy(audio.poster_public_id);
      }

      // Upload new poster to Cloudinary
      const posterRes = await cloudinary.uploader.upload(poster.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

      // Update the poster information in the database
      await pool.query(
        `UPDATE audios
           SET poster_url = $1,
               poster_public_id = $2
           WHERE id = $3`,
        [posterRes.secure_url, posterRes.public_id, audioId]
      );
    }

    // Retrieve the updated audio record
    const updatedAudioResult = await pool.query(
      "SELECT * FROM audios WHERE id = $1",
      [audioId]
    );

    const updatedAudio = updatedAudioResult.rows[0];

    res.status(200).json({
      audio: {
        title: updatedAudio.title,
        about: updatedAudio.about,
        file: updatedAudio.file_url,
        poster: updatedAudio.poster_url,
      },
    });
  } catch (error) {
    console.error("Error updating audio:", error);
    res.status(500).json({ error: "An error occurred while updating audio." });
  }
};

export const getLatestTenAudios: RequestHandler = async (req, res) => {
  try {
    // Query to get the latest uploads
    const { rows } = await pool.query(`
          SELECT
            a.id AS audio_id,
            a.title,
            a.about,
            a.category,
            a.file_url AS file,
            a.poster_url AS poster,
            u.id AS owner_id,
            u.name AS owner_name
          FROM audios a
          LEFT JOIN users u ON a.owner = u.id
          ORDER BY a.created_at DESC
          LIMIT 10
        `);

    // Transform the result into the desired format
    const audios = rows.map((row) => ({
      id: row.audio_id,
      title: row.title,
      about: row.about,
      category: row.category,
      file: row.file,
      poster: row.poster,
      owner: {
        name: row.owner_name,
        id: row.owner_id,
      },
    }));

    res.json({ audios });
  } catch (error) {
    console.error("Error fetching latest uploads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
