import { RequestHandler } from "express";
import pool from "#/db/db";

export const updateHistory: RequestHandler = async (req, res) => {
  console.log("xx");
  const { audio, progress, date } = req.body;
  const userId = req.user.id;

  // Convert JavaScript Date object to UTC
  const formattedDate = new Date(date).toISOString();

  // Check if a history record exists for the user
  const {
    rows: [oldHistory],
  } = await pool.query(`SELECT * FROM history WHERE owner = $1`, [userId]);

  if (!oldHistory) {
    console.log("ccc1");
    // Create a new history record
    const newHistoryResult = await pool.query(
      `
        INSERT INTO history (owner, last_audio, last_progress, last_date)
        VALUES ($1, $2, $3, $4)
      `,
      [userId, audio, progress, formattedDate]
    );
    console.log("ccc2");

    const newHistoryId = newHistoryResult.rows[0].id;
    console.log("ccc3");

    // Insert a audio entry in history entories
    await pool.query(
      `
        INSERT INTO history_entries (history_id, audio_id, progress, date)
        VALUES ($1, $2, $3, $4)
      `,
      [newHistoryId, audio, progress, formattedDate]
    );

    return res.json({ success: true });
  } else {
    // Update existing history logic

    // Get the start and end of the current day  (sube he 12 baje (00:00amstart), rat he (23.59 pm end))
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Check if there's an history entry for the current day, for same audio
    const {
      rows: [sameDayHistoryEnteryofthisAudio],
    } = await pool.query(
      `
      SELECT * FROM history_entries
      WHERE history_id = $1 AND date >= $2 AND date <= $3 AND audio_id = $4
    `,
      [oldHistory.id, startOfDay, endOfDay, audio]
    );

    if (sameDayHistoryEnteryofthisAudio) {
      // if he toh us audio entery ko hi update kardo
      await pool.query(
        `
        UPDATE history_entries
        SET progress = $1, date = $2
        WHERE id = $3
      `,
        [progress, date, sameDayHistoryEnteryofthisAudio.id]
      );

      // Update the last history record to this audio
      await pool.query(
        `
                UPDATE history
                SET last_audio = $1, last_progress = $2, last_date = $3
                WHERE id = $4
              `,
        [audio, progress, date, oldHistory.id]
      );
    } else {
      // if nhi he toh add new history entry for this audio
      await pool.query(
        `
        INSERT INTO history_entries (history_id, audio_id, progress, date)
        VALUES ($1, $2, $3, $4)
      `,
        [oldHistory.id, audio, progress, date]
      );

      // Update the last history record to this audio
      await pool.query(
        `
        UPDATE history
        SET last_audio = $1, last_progress = $2, last_date = $3
        WHERE id = $4
      `,
        [audio, progress, date, oldHistory.id]
      );
    }

    res.json({ success: true });
  }
};

export const removeHistory: RequestHandler = async (req, res) => {
  const removeAll = req.query.all === "yes";
  const userId = req.user.id;

  if (removeAll) {
    // Remove all history records for the user
    await pool.query(
      `
        DELETE FROM history WHERE owner = $1
      `,
      [userId]
    );

    // Also remove all related entries
    await pool.query(
      `
        DELETE FROM history_entries WHERE history_id IN (
          SELECT id FROM history WHERE owner = $1
        )
      `,
      [userId]
    );

    return res.json({ success: "true1" });
  }

  const todelhistories = req.query.todelhistories as string;
  const ids = JSON.parse(todelhistories) as string[];

  console.log(ids);
  // Remove specified entries from history
  await pool.query(
    `
      DELETE FROM history_entries
      WHERE id = ANY($1::uuid[])
    `,
    [ids]
  );

  res.json({ success: "true2" });
};

export const getHistories: RequestHandler = async (req, res) => {
  const { limit = "20", pageNo = "0" } = req.query as {
    limit: string;
    pageNo: string;
  };
  const userId = req.user.id;
  const offset = parseInt(pageNo) * parseInt(limit);
  const limitInt = parseInt(limit);

  // Query to get history records with pagination and group by date
  const { rows } = await pool.query(
    `
      SELECT
        TO_CHAR(e.date, 'YYYY-MM-DD') AS date,
        json_agg(
          json_build_object(
            'id', e.id,
            'audioId', a.id,
            'title', a.title,
            'date', e.date,
            'progress', e.progress
          )
        ) AS audios
      FROM history_entries e
      JOIN audios a ON e.audio_id = a.id
      JOIN history h ON e.history_id = h.id
      WHERE h.owner = $1
      GROUP BY TO_CHAR(e.date, 'YYYY-MM-DD')
      ORDER BY MIN(e.date) DESC
      LIMIT $2 OFFSET $3
    `,
    [userId, limitInt, offset]
  );

  // Format the response
  const formattedHistories = rows.map((row) => ({
    date: row.date,
    audios: row.audios,
  }));

  res.json({ histories: formattedHistories });
};

// Get the most recent 10 history entries for curr user
export const getRecentlyPlayed: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const { rows: recentHistories } = await pool.query(
    `
      SELECT e.id, a.id AS audio_id, a.title, a.about, a.file_url, a.poster_url, a.category, u.name AS owner_name, u.id AS owner_id, e.date, e.progress
      FROM history_entries e
      JOIN audios a ON e.audio_id = a.id
      JOIN users u ON a.owner = u.id
      JOIN history h ON e.history_id = h.id
      WHERE h.owner = $1
      ORDER BY e.date DESC
      LIMIT 10
    `,
    [userId]
  );

  res.json({
    audios: recentHistories.map((h) => ({
      id: h.audio_id,
      title: h.title,
      about: h.about,
      file: h.file_url,
      poster: h.poster_url,
      category: h.category,
      owner: { name: h.owner_name, id: h.owner_id },
      date: h.date,
      progress: h.progress,
    })),
  });
};

// updateHistory:
// Checks if a history record exists.
// Inserts or updates history records and entries based on whether they already exist for the day.

// removeHistory:
// Deletes all history records or specified history entries for a user.

// getHistories:
// Retrieves paginated history entries and groups them by date.  manually groups the entries as PostgreSQL does not have a direct equivalent to MongoDB's $group stage.

// getRecentlyPlayed:
// Fetches the 10 most recent audio interactions and joins with audios and users to get detailed information about the audios and their owners.

// get histories without grouo by
//manually group it using reduce and mapping it

// export const getHistories: RequestHandler = async (req, res) => {
//     const { limit = "20", pageNo = "0" } = req.query as {
//       limit: string;
//       pageNo: string;
//     };
//     const userId = req.user.id;
//     const offset = parseInt(pageNo) * parseInt(limit);
//     const limitInt = parseInt(limit);

//     const { rows: histories } = await pool.query(
//       `
//         SELECT e.id, a.id AS audio_id, e.date, a.title
//         FROM history_entries e
//         JOIN audios a ON e.audio_id = a.id
//         JOIN history h ON e.history_id = h.id
//         WHERE h.owner = $1
//         ORDER BY e.date DESC
//         LIMIT $2 OFFSET $3
//       `,
//       [userId, limitInt, offset]
//     );
//      //map all audios to dates  .. each date can have muliple audio history entry
//     const groupedHistories = histories.reduce((acc, cur) => {
//       const date = cur.date.toISOString().split("T")[0];
//       if (!acc[date]) acc[date] = [];
//       acc[date].push(cur);
//       return acc;
//     }, {});

//      //return repsonse, convert array into object
//     res.json({
//       histories: Object.entries(groupedHistories).map(([date, audios]) => ({
//         date,
//         audios,
//       })),
//     });
//   };
