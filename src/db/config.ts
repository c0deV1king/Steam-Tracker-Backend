 import dotenv from "dotenv";
dotenv.config();
 
// connecting to the database, easy to understand

 const dbConfig = {
  database: process.env.DATABASE as string,
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD as string,
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT || 31029),
};

export default dbConfig;