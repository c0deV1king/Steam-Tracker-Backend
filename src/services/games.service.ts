import axios from "axios";
import dotenv from "dotenv";
import Game from "../models/games.model.js";
import sequelize from "../db/db.js";
dotenv.config();

interface CombinedGameData {
  appid: number;
  gameName: string;
  schema: any;
  headerImage: string;
}

export class GamesService {
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

  async fetchGames(steamId: string): Promise<Game[] | null> {
    console.log("Fetching Steam games for steamId:", steamId);
    try {
      await sequelize.sync();
      const { data: allGamesResponse } = await axios.get(
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

      //extract the appids from games list
      const appIds = games.map((game: any) => game.appid);

      await this.rateLimitDelay(300, 700);

      console.log("fetchGames finished");

      const gameSchema = async (appid: number[]): Promise<any> => {
        await this.rateLimitDelay(300, 700);
        return axios
          .get(
            `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?appid=${appid}&key=${this.steamApiKey}`
          )
          .then((res) => res.data);
      };

      const combinedGameData: CombinedGameData[] = [];

      for (let i = 0; i < appIds.length; i++) {
        const appid = appIds[i];
        await this.rateLimitDelay(300, 700);

        Game.count({ where: { appid: appid } }).then(async (count) => {
          if (count > 0) {
            console.log(`Game with appid ${appid} already exists in database.`);
          } else {
            console.log(`Fetching game schema for appid: ${appid}`);
            const gameSchemaData = await gameSchema([appid]);

            const headerImage = `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/capsule_616x353.jpg`;

            const gameName = gameSchemaData?.game?.gameName || "Unknown Game";

            combinedGameData.push({
              appid: games[i].appid,
              gameName: gameName,
              schema: gameSchemaData,
              headerImage: headerImage,
            });

            console.log(`Upserting game:, ${gameName} - ${appid}`);
            // upsert is a sequelize function. It updates the entry if it exists, otherwise it will create a new one
            await Game.upsert({
              appid: games[i].appid,
              gameName: gameName,
              headerImage: headerImage || "",
            });

            console.log("Games stored in database successfully.");
          }
        });
      }
      return Game.findAll({ where: { appid: appIds } });
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }

  async getGames(): Promise<Game[]> {
    try {
      // making sure everything is synced (unsure if I am using this correctly)
      await sequelize.sync({ force: false });
      return await Game.findAll();
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
