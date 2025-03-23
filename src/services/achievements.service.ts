import axios from "axios";
import dotenv from "dotenv";
import Achievement from "../models/achievements.model.js";
import sequelize from "../db/db.js";
dotenv.config();

interface SteamGameResponse {
  response: {
    game_count: number;
    games: any[];
  };
}

// for all the achievements info, we need to use schema and getplayerachievements. that will be two api calls per game.
// schema has name(same as apiname), displayName, desc, icon, icongrey
// getplayerachievements has apiname, achieved and unlock time
// use apiname & name to match the acheivements together

// flow:
// use the games table in db to grab the appids
// somehow check to see if the achievements are already in the db
// if not, make a call to gameschema to get all games achievements, going through each appid
// then make a call to getplayerachievements for each appid
// match the achievements with name and api name
// store the achievements in the db
// logic to use: if statements and for loops

export class AchievementsService {
  private steamApiKey: string;
  private steamId: string;

  constructor() {
    this.steamApiKey = process.env.steamApiKey || "";
    this.steamId = process.env.steamId || "";

    if (!this.steamApiKey || !this.steamId) {
      throw new Error(
        "Steam API key or Steam ID not found in environment variables"
      );
    }
  }

  rateLimitDelay = (min: number, max: number): Promise<void> => {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.random() * (max - min) + min)
    );
  };

  async fetchAchievements(steamId: string): Promise<Achievement[] | null> {
    console.log("Fetching Steam games for steamId:", steamId);
    try {
      await sequelize.sync();
      const { data: allAchievementsResponse } =
        await axios.get<SteamGameResponse>(
          `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
          {
            params: {
              key: this.steamApiKey,
              steamid: steamId,
              include_appinfo: true,
              include_played_free_games: true,
            },
          }
        );
      const games = allGamesResponse.response.games || [];

      if (games.length === 0) return null;

      const ownedGameData: CombinedGameData[] = games.map((game: any) => ({
        appid: game.appid,
        gameName: game.name || "Unknown Game",
        playtime_forever: game.playtime_forever || 0,
        headerImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
      }));

      await this.rateLimitDelay(300, 700);
      console.log("fetchGames finished");

      await Promise.all(
        ownedGameData.map((game) =>
          Game.upsert({
            appid: game.appid,
            gameName: game.gameName,
            playtime_forever: game.playtime_forever,
            headerImage: game.headerImage,
          })
        )
      );

      console.log("Games stored in database successfully.");
      return Game.findAll({
        where: { appid: ownedGameData.map((g) => g.appid) },
      });
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }

  async getAchievements(): Promise<Game[]> {
    try {
      await sequelize.sync({ force: false });
      return await Game.findAll();
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
