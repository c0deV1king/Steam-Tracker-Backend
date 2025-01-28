require("dotenv").config();
const config = {
    port: process.env.MYSQLPORT,
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
  
  module.exports = config;