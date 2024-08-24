import fs from "fs";
import path from "path";
import pool from "../db/db"; // Adjust path if needed

// Function to execute schema SQL file
async function executeSchema() {
  const sqlFilePath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf8");

  try {
    await pool.query(sql);
    console.log("Database schema applied successfully!");
  } catch (error) {
    console.error("Error applying schema:", error);
  }
}

//Uses a PL/pgSQL DO block to check if indices exist and creates them if they don't.
//This approach handles the conditional creation of indices based on their existence.

// Function to check and create indices
async function createIndices() {
  const indexCreationSql = `
      DO $$
      BEGIN
        -- Create index on created_at if it doesn't exist
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE tablename = 'email_verification_tokens' AND indexname = 'idx_created_at'
        ) THEN
          EXECUTE 'CREATE INDEX idx_created_at ON email_verification_tokens(created_at)';
        END IF;
  
        -- Create index on expiry if it doesn't exist
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE tablename = 'email_verification_tokens' AND indexname = 'idx_expiry'
        ) THEN
          EXECUTE 'CREATE INDEX idx_expiry ON email_verification_tokens(expiry)';
        END IF;
      END $$;
    `;

  try {
    await pool.query(indexCreationSql);
    console.log("Indices checked and created if necessary.");
  } catch (error) {
    console.error("Error creating indices:", error);
  }
}

// Run schema setup and index creation
async function setupDatabase() {
  await executeSchema();
  //await createIndices();
}

// Run schema setup
setupDatabase()
  .then(() => {
    process.exit(0); // Exit after executing schema
  })
  .catch((error) => {
    console.error("Failed to execute schema:", error);
    process.exit(1); // Exit with error code
  });
