// import pg from "pg";
// import dotenv from "dotenv";
// dotenv.config();

// const { Client } = pg;

// const client = new Client({
//   host: process.env.DB_HOST, // Supabase host
//   port: process.env.DB_PORT, // Default PostgreSQL port
//   user: process.env.DB_USERNAME, // Supabase username
//   password: process.env.DB_PASSWORD, // Supabase password
//   database: process.env.DB_DATABASE, // Supabase database
//   ssl: { rejectUnauthorized: false }, // Required for Supabase connection
// });

// (async () => {
//   try {
//     await client.connect();
//     console.log("Database connected successfully via Session Pooler");
//   } catch (error) {
//     console.error("Database connection error:", error.message);
//   }
// })();

// export default client;
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL
});

(async () => {
  try {
    await client.connect();
    console.log("Database connected successfully via Session Pooler");
  } catch (error) {
    console.error("Database connection error:", error.message);
  }
})();

export default client;

