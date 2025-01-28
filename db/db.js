const mysql = require("mysql");
const config = require("./config");

const connection = mysql.createConnection({
  port: process.env.MYSQLPORT,
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE
})
