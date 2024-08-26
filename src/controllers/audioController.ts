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
