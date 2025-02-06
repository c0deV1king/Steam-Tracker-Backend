const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const port = process.env.PORT;
const { connection } = require("./src/db/config")
const demoRoutes = require("./src/routes/demoRoutes")
const playerSummaryRoutes = require("./src/routes/playerSummary")

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

// Note for me: this is how i understood the logic (https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)

app.use("/api/v1/Profile", demoRoutes)
app.use("/api/v1/Summary", playerSummaryRoutes)

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});