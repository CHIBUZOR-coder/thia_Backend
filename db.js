import pg from "pg";
import dotenv from "dotenv"
dotenv.config();
const { Client } = pg;



const client = new Client({
  host: "localhost",
  port: 5432,
  user: process.env.DB_USER, // Changed to match .env
  password: process.env.DB_PASSWORD, // Changed to match .env
  database: process.env.DB_DATABASE, // Changed to match .env
});


console.log(`user: ${process.env.DB_USER}`);


(async () => {
  try {
    await client.connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
  }
})();

export default client;