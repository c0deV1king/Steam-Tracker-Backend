const mysql = require('mysql2');
const url = require('url');

const dbUrl = new URL(process.env.MYSQL_PUBLIC_URL)

const connection = mysql.createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substr(1),
  port: dbUrl.port
});

module.exports = { connection }