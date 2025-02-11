import mysql from 'mysql2';

const host = process.env.MYSQLHOST;
const user = process.env.MYSQLUSER;
const pass = process.env.MYSQLPASSWORD;
const port = Number(process.env.MYSQLPORT);
const database = process.env.MYSQLDATABASE;

export const connection = mysql.createConnection({
  host: host,
  user: user,
  password: pass,
  database: database,
  port: port
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to database!");
});