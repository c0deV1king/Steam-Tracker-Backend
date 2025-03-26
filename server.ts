import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
const port = process.env.PORT || 3000;
import { ProfileController } from "./src/controllers/profile.controller.js";
import { GameController } from "./src/controllers/games.controller.js";
import { AchievementsController } from "./src/controllers/achievements.controller.js";

const profileController = new ProfileController();
const gameController = new GameController();
const achievementsController = new AchievementsController();
const app = express();

var allowedOrigins = [
  "http://localhost:8080",
  "https://steam-tracker-demo-production.up.railway.app/",
  "https://steam-tracker.codeviking.io",
];

console.log("Asking cors if I am okay to use...");
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Note for me: this is how i understood the logic (https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)

// endpoints to be called
app.use("/api/profiles", profileController.route);

app.use("/api/games", gameController.route);

app.use("/api/achievements", achievementsController.route);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
