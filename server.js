const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const port = process.env.port;
const { connection } = require("./db/config")

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database!');
});

// Create a test endpoint that checks everything
app.get('/api/test-connection', (req, res) => {
  // Test database connection with a simple query
  connection.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('Database test failed:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: err.message
      });
    }

    // If we get here, everything is working!
    res.json({
      status: 'success',
      message: 'All systems operational',
      database: 'Connected successfully',
      result: results[0].result  // Should return 2
    });
  });
});

app.get('/controllers/getPlayerSummary')

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});