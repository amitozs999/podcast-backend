import cron from "node-cron";
import pool from "../db/db"; // Adjust the path to your database pool

// Schedule a task to run every hour
cron.schedule("*/2 * * * *", async () => {
  console.log("Running scheduled job to delete expired tokens...");

  try {
    await pool.query(`
      DELETE FROM email_verification_tokens
      WHERE expiry < NOW();
    `);
    await pool.query(`
      DELETE FROM password_reset_tokens
      WHERE expiry < NOW();
    `);

    console.log(
      "Expired email_verification_tokens and  password_reset_tokens deleted successfully."
    );
  } catch (err) {
    console.error("Error executing job:", err);
  }
});

//designed to automatically generate and update playlists based on the top audios grouped by category

// Step 1: Query the top 20 audios by likes and group them by category.

// Step 2: For each category:
// Upsert (update/insert  ) the playlist.

// Clear old items from the playlist.
// Insert new audio items into the playlist.

const upsertAutoGeneratPlaylists = async () => {
  try {
    // Step 1: Get the top 20 audios by likes and group by category
    const { rows: categories } = await pool.query(`
      WITH top_audios AS (
        SELECT id, category
        FROM audios
        ORDER BY likes DESC
        LIMIT 20
      )
      SELECT category, array_agg(id) AS audio_ids
      FROM top_audios
      GROUP BY category;
    `);

    // categ1- [audID1,audID12,audID13]
    // categ2- [audID2,audID22,audID123]

    // Step 2: Iterate through each category and audio IDs to upsert playlists and update items

    //Upsert a playlist into auto_generated_playlists.
    // Clear existing items from auto_playlist_audio_items for the playlist.
    // Insert new audio items.

    for (const { category, audio_ids } of categories) {
      // insert or update this new  auto_playlist

      const { rows: playlistRows } = await pool.query(
        `
        INSERT INTO auto_generated_playlists (title, created_at, updated_at)
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (title) DO UPDATE
        SET updated_at = CURRENT_TIMESTAMP
        RETURNING id;
      `,
        [category]
      );

      const playlistId = playlistRows[0]?.id;

      if (playlistId) {
        // Clear previous items of this auto_playlist

        await pool.query(
          `
          DELETE FROM auto_playlist_audio_items
          WHERE playlist_id = $1;
        `,
          [playlistId]
        );

        // Insert new audio items for this auto_playlist

        for (const audioId of audio_ids) {
          await pool.query(
            `
            INSERT INTO auto_playlist_audio_items (playlist_id, audio_id)
            VALUES ($1, $2)
            `,
            [playlistId, audioId]
          );
        }
      }
    }

    console.log("Playlists generated and updated successfully");
  } catch (err) {
    console.error("Error generating playlists:", err);
  }
};

// Schedule the function to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  await upsertAutoGeneratPlaylists();
});
