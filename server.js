const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const port = process.env.PORT;
const { connection } = require("./db/config")

const app = express();

var allowedOrigins = [
  'http://localhost:8080',
  'https://steam-tracker-demo-production.up.railway.app/', 
  'https://steam-tracker.codeviking.io'
  ];

  console.log("Asking cors if I am okay to use...")
  app.use(cors({
    origin: function(origin, callback){    // allow requests with no origin 
      if(!origin) return callback(null, true);    if(allowedOrigins.indexOf(origin) === -1){
        var msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }    return callback(null, true);
    }
  }));

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