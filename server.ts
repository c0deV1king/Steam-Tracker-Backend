import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
const port = process.env.PORT;
import { playerSummaryRoutes } from './src/routes/playerSummary.js'
// Example flow
import { ProfileService } from "./flowExample.js";
const profileService = new ProfileService();

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

app.use("/api/v1/Summary", playerSummaryRoutes)

//Example from flowExample.ts
app.get('/profiles', async (req, res) => {
  try {
    const profiles = await profileService.getProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});