const mysql = require('mysql2');
const url = require('url');

const dbUrl = new URL(process.env.MYSQL_PUBLIC_URL)

const connection = mysql.createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname,
  port: dbUrl.port
});

connection.connect((eer) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database!');
});