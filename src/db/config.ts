 import dotenv from "dotenv";
dotenv.config();
 
 const dbConfig = {
  database: process.env.MYSQLDATABASE,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
};

export default dbConfig;