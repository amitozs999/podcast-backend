import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import pool from "#/db/db";
import { getUsersPreviousHistory } from "#/utils/helper";

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

// This function retrieves recommended audios based on the user's previous history
//or provides generic recommendations.

// Fetch User's Previous History: Retrieve the categories of audios the user has interacted
//with in the past 30 days, then find most liked audios of this categories will recmoed user this.

// Fetch Recommended Audios: Use the fetched categories to get the recommended audios
//or fallback to generic recommendations if no categories are found (not logged in tha).

export const getRecommendByProfile: RequestHandler = async (req, res) => {
  const userId = req.user?.id; // Can be undefined if user is not logged in

  //Retrieves categories from the user's history within the last 30 days.
  //Fetches audios sorted by the number of likes. If categories are present, filters by them.

  try {
    // Fetch user's previous history categories
    let categoryConditions: string[] = [];

    if (userId) {
      // Fetch user's previous history
      const categories = await getUsersPreviousHistory(userId);
      if (categories.length > 0) {
        categoryConditions = categories;
      }
    }

    // Query to fetch recommended audios
    let query = `
        SELECT
          id,
          title,
          category,
          about,
          file_url AS file,
          poster_url AS poster,
          favorites_count,
          owner AS owner_id
        FROM audios
      `;

    // Add condition for categories if there are any
    if (categoryConditions.length > 0) {
      query += `
          WHERE a.category = ANY($1)
        `;
    }

    // Complete query
    query += `
        ORDER BY a.favorites_count DESC
        LIMIT 10
      `;

    // Execute the query with parameters
    const audiosResult = await pool.query(query, [
      categoryConditions.length > 0 ? categoryConditions : null,
    ]);

    const audios = audiosResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      about: row.about,
      file: row.file,
      poster: row.poster,
      owner: { name: row.owner_name, id: row.owner_id },
    }));

    res.json({ audios });
  } catch (error) {
    console.error("Error fetching recommended audios:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//This function creates an auto-generated playlist based on the user's history
//and also fetches other auto-generated playlists.

//Creates or updates a playlist with 20 randomly sampled audios from the user's history.
//Fetches other auto-generated playlists and combines them with the newly created "Mix 20" playlist.
//Retrieves up to 4 random auto-generated playlists from the auto_generated_playlists table.

//each user has their own mix20 playlist

export const getAutoGeneratedPlaylist: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const title = "Mix 20";

  //Fetches audio IDs from the user's history in the past 30 days. Limits the results to 20 most recent items.
  //Inserts a new playlist titled "Mix 20" if it doesn't exist or updates it if it does.

  try {
    // Step 1: Generate playlist from user's history
    const { rows: historyResults } = await pool.query(
      `
        SELECT he.audio_id
        FROM history h
        JOIN history_entries he ON h.id = he.history_id
        WHERE h.owner = $1
        ORDER BY he.date DESC
        LIMIT 20
      `,
      [userId]
    );

    const audioIds = historyResults.map((row) => row.audio_id);

    // Insert or update the "Mix 20" playlist
    const { rows: mix20Playlist } = await pool.query(
      `
        INSERT INTO auto_generated_playlists (title, owner, visibility, created_at, updated_at)
        VALUES ($1, $2, 'auto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (title, owner) DO UPDATE
        SET updated_at = CURRENT_TIMESTAMP
      `,
      [title, userId]
    );

    const mix20PlaylistId = mix20Playlist[0].id;

    // Clear previous items and add new ones

    await pool.query(
      `
        DELETE FROM auto_generated_playlist_audio_items
        WHERE playlist_id = $1
      `,
      [mix20PlaylistId]
    );

    for (const audioId of audioIds) {
      await pool.query(
        `
            INSERT INTO auto_generated_playlist_audio_items(playlist_id, audio_id)
            VALUES ($1, $2)
          `,
        [mix20PlaylistId, audioId]
      );
    }

    //The LEFT JOIN ensures that even playlists
    //without any associated audio items are included in the results,

    //LEFT JOIN returns all rows from the left table (in this case, auto_generated_playlists)
    //and the matched rows from the right table (auto_playlist_audio_items).
    //If there is no match, the result is NULL on the side of the right table.

    // Step 2: Fetch other auto-generated playlists
    const { rows: autoPlaylists } = await pool.query(`
        SELECT p.id AS id, p.title AS title, COUNT(pai.audio_id) AS items_count
        FROM auto_generated_playlists p
        LEFT JOIN auto_generated_playlist_audio_items pai ON p.id = pai.playlist_id
        WHERE p.visibility = 'auto'
        GROUP BY p.id
        ORDER BY RANDOM()
        LIMIT 4
      `);

    // Step 4: Include the "Mix 20" playlist in the final result

    const finalPlaylists = autoPlaylists.concat({
      id: mix20PlaylistId,
      title,
      items_count: audioIds.length,
    });

    res.json({ playlist: finalPlaylists });
  } catch (error) {
    console.error("Error generating or fetching playlists:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//followings table tracks
//follower_id (the user who is following) following_id (the user being followed)

// The JOIN condition f.follower_id = u.id is  kyonki followers wale users chaihe
// filter by f.follower_id = $1 (current user's ID).

export const getMyFollowers: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const userId = req.user.id;

  // Calculate the OFFSET and LIMIT for pagination
  const limitInt = parseInt(limit);
  const offsetInt = parseInt(pageNo) * limitInt;

  try {
    //curr user ke followers
    //following_id (the user being followed) is this user  .. jeski following me ye user he
    // WHERE f.following_id = $1

    const { rows } = await pool.query(
      `
        SELECT
          u.id AS id,
          u.name AS name,
          u.avatar->>'url' AS avatar
        FROM followings f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = $1
        LIMIT $2 OFFSET $3
      `,
      [userId, limitInt, offsetInt]
    );

    // Format the response
    res.json({ followers: rows });
  } catch (err) {
    console.error("Error retrieving followers profiles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//followings table tracks
//follower_id (the user who is following) following_id (the user being followed)

// The JOIN condition f.following_id = u.id is  kyonki following wale users chaihe
// filter by f.follower_id = $1 (current user's ID).

export const getMyFollowings: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const userId = req.user.id;

  // Calculate the OFFSET and LIMIT for pagination
  const limitInt = parseInt(limit);
  const offsetInt = parseInt(pageNo) * limitInt;

  try {
    //curr user ke followings
    //follower_id (the user who is following) is this user ..ye follower he
    //jiski follower_id me curr user he WHERE f.follower_id = $1

    const { rows } = await pool.query(
      `
        SELECT
          u.id AS id,
          u.name AS name,
          u.avatar->>'url' AS avatar
        FROM followings f
        JOIN users u ON f.following_id = u.id  
        WHERE f.follower_id = $1
        LIMIT $2 OFFSET $3
      `,
      [userId, limitInt, offsetInt]
    );

    // Format the response
    res.json({ followings: rows });
  } catch (err) {
    console.error("Error retrieving followings profiles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowersofPassedUser: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const userId = req.user.id;

  const { profileId } = req.params;

  // Calculate the OFFSET and LIMIT for pagination
  const limitInt = parseInt(limit);
  const offsetInt = parseInt(pageNo) * limitInt;

  try {
    //passed user ke followers
    //following_id (the user being followed) is this user  .. jeski following me ye he
    // WHERE f.following_id = $1

    const { rows } = await pool.query(
      `
        SELECT
          u.id AS id,
          u.name AS name,
          u.avatar->>'url' AS avatar
        FROM followings f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = $1
        LIMIT $2 OFFSET $3
      `,
      [profileId, limitInt, offsetInt]
    );

    // Format the response
    res.json({ followers: rows });
  } catch (err) {
    console.error("Error retrieving followers profiles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingsofPassedUser: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const userId = req.user.id;
  const { profileId } = req.params;

  // Calculate the OFFSET and LIMIT for pagination
  const limitInt = parseInt(limit);
  const offsetInt = parseInt(pageNo) * limitInt;

  try {
    //curr user ke followings
    //follower_id (the user who is following) is this user ..ye follower he
    //jiski follower_id me curr user he WHERE f.follower_id = $1

    const { rows } = await pool.query(
      `
          SELECT
            u.id AS id,
            u.name AS name,
            u.avatar->>'url' AS avatar
          FROM followings f
          JOIN users u ON f.following_id = u.id  
          WHERE f.follower_id = $1
          LIMIT $2 OFFSET $3
        `,
      [profileId, limitInt, offsetInt]
    );

    // Format the response
    res.json({ followings: rows });
  } catch (err) {
    console.error("Error retrieving followings profiles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
