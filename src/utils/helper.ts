import moment from "moment";
import pool from "#/db/db";

export const generateToken = (length = 6) => {
  // declare a variable
  let otp = "";

  for (let i = 0; i < length; i++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};

export const getUsersPreviousHistory = async (
  userId: string
): Promise<string[]> => {
  try {
    // Fetch user's previous history categories
    const { rows: historyResults } = await pool.query(
      `
        SELECT DISTINCT a.category
        FROM history h
        JOIN history_entries he ON h.id = he.history_id
        JOIN audios a ON he.audio_id = a.id
        WHERE h.owner = $1
        AND he.date >= $2
      `,
      [userId, moment().subtract(30, "days").toDate()]
    );

    // Extract and return categories
    return historyResults.map((row) => row.category);
  } catch (error) {
    console.error("Error fetching user history:", error);
    return [];
  }
};
