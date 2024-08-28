import { RequestHandler } from "express";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

import pool from "#/db/db";

export const updateFollower: RequestHandler = async (req, res) => {
  console.log("zz");

  const { profileIdtoFollow } = req.params;
  const userId = req.user.id as string;
  let status: "added" | "removed";

  //   if (!uuidv4.validate(profileIdtoFollow))
  //     return res.status(422).json({ error: "Invalid profile id!" });

  // Check if the profile exists
  const profileRes = await pool.query("SELECT * FROM users WHERE id = $1", [
    profileIdtoFollow,
  ]);
  if (profileRes.rowCount === 0)
    return res.status(404).json({ error: "Profile not found!" });

  // Check if this currentuser already followed(him)
  const alreadyAFollowerRes = await pool.query(
    "SELECT * FROM followers WHERE follower_id = $1 AND followed_id = $2",
    [userId, profileIdtoFollow]
  );

  const alreadyAFollowerCount: number = alreadyAFollowerRes.rowCount as number;

  if (alreadyAFollowerCount > 0) {
    // already followed him tha, so now unfollow him
    await pool.query(
      "DELETE FROM followers WHERE follower_id = $1 AND followed_id = $2",
      [userId, profileIdtoFollow]
    );
    status = "removed";
  } else {
    //  already followed nhi tha, so follow him
    await pool.query(
      "INSERT INTO followers (follower_id, followed_id) VALUES ($1, $2)",
      [userId, profileIdtoFollow]
    );
    status = "added";
  }

  // Update followings list for the user
  if (status === "added") {
    // profileIdtoFollow   kojisnefolowkiya(curruser)   insert
    await pool.query(
      "INSERT INTO followings (follower_id, following_id) VALUES ($1, $2)",
      [profileIdtoFollow, userId]
    );
  } else {
    // profileIdtoFollow    kojisneUnfolowkiya(curruser)  remove

    await pool.query(
      "DELETE FROM followings WHERE follower_id = $1 AND following_id = $2",
      [profileIdtoFollow, userId]
    );
  }

  res.json({ status });
};

//fetch all details of this profileId user
export const getPublicProfile: RequestHandler = async (req, res) => {
  const { profileId } = req.params;

  try {
    // Query to get the user's profile
    const userRes = await pool.query(
      "SELECT id, name, avatar, (SELECT COUNT(*) FROM followers WHERE followed_id = $1) AS followers_count FROM users WHERE id = $1",
      [profileId]
    );

    // Check if user is found
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Extract user data
    const user = userRes.rows[0];
    const profile = {
      id: user.id,
      name: user.name,
      followers: parseInt(user.followers_count, 10),
      avatar: user.avatar?.url || null,
    };

    res.json({ profile });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicPlaylist: RequestHandler = async (req, res) => {
  const { profileId } = req.params;
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };

  const limitInt = parseInt(limit, 10);
  const pageNoInt = parseInt(pageNo, 10);

  //Use type assertions to ensure TypeScript understands that your query parameters are strings
  //or convert them to the appropriate types.
  //   const limitParam = req.query.limit as string | undefined;
  //   const pageNoParam = req.query.pageNo as string | undefined;

  //   // Default values for pagination
  //   const limitInt = limitParam ? parseInt(limitParam, 10) : 20;
  //   const pageNoInt = pageNoParam ? parseInt(pageNoParam, 10) : 0;

  if (isNaN(limitInt) || isNaN(pageNoInt)) {
    return res.status(400).json({ error: "Invalid pagination parameters!" });
  }

  try {
    // Query to get public playlists for the given profile
    const playlistRes = await pool.query(
      `SELECT id, title, ARRAY_LENGTH(items, 1) AS items_count, visibility 
       FROM playlists 
       WHERE owner = $1 AND visibility = 'public' 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [profileId, limitInt, pageNoInt * limitInt]
    );

    // Check if playlists are found
    if (playlistRes.rowCount === 0) {
      return res.json({ playlist: [] });
    }

    // Format the playlists for response
    const playlists = playlistRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      itemsCount: row.items_count,
      visibility: row.visibility,
    }));

    res.json({ playlist: playlists });
  } catch (error) {
    console.error("Error fetching public playlists:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUploadedAudio: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };

  const userId = req.user.id as string;

  const uploadsRes = await pool.query(
    `SELECT id, title,category, about, file_url AS file, poster_url AS poster, created_at AS date
     FROM audios
     WHERE owner = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, parseInt(limit), parseInt(limit) * parseInt(pageNo)]
  );

  const audios = uploadsRes.rows.map((item) => ({
    id: item.id,
    title: item.title,
    about: item.about,
    category: item.category,
    file: item.file,
    poster: item.poster,
    date: item.date,
    owner: { name: req.user.name, id: userId },
  }));

  res.json({ audios });
};

export const getAllploadedAudiofPassedUser: RequestHandler = async (
  req,
  res
) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const { profileId } = req.params;

  const audiosRes = await pool.query(
    `SELECT audios.id, audios.title, audios.about, audios.file_url AS file, audios.poster_url AS poster, audios.created_at AS date,
            users.name AS owner_name, users.id AS owner_id
     FROM audios
     JOIN users ON audios.owner = users.id
     WHERE audios.owner = $1
     ORDER BY audios.created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, parseInt(limit), parseInt(limit) * parseInt(pageNo)]
  );

  const audios = audiosRes.rows.map((item) => ({
    id: item.id,
    title: item.title,
    about: item.about,
    file: item.file,
    poster: item.poster,
    date: item.date,
    owner: { name: item.owner_name, id: item.owner_id },
  }));

  res.json({ audios });
};

export const getIsFollowing: RequestHandler = async (req, res) => {
  const { profileId } = req.params;
  const userId = req.user.id; // Assuming req.user.id is set by authentication middleware

  //   console.log(profileId);
  //   console.log(userId);

  // // Validate the profile ID format
  // if (!isValidUUID(profileId)) {
  //   return res.status(422).json({ error: "Invalid profile id!" });
  // }

  try {
    // Query to check if the user is following the profile
    const { rows } = await pool.query(
      `SELECT EXISTS (
          SELECT 1 
          FROM followers 
          WHERE follower_id = $1 AND followed_id = $2
        ) AS is_following`,
      [userId, profileId]
    );

    // Directly use the result with alias
    res.json({ status: rows[0].is_following });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
