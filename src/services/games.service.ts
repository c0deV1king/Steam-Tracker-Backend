import axios from "axios";
import dotenv from "dotenv";
import Game from "../models/games.model.js";
import sequelize from "../db/db.js";
dotenv.config();

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

  async fetchGames(steamId: string): Promise<Game | null> {
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

      await this.rateLimitDelay(300, 1000);

      console.log("fetchGames finished");

      console.log("starting gameSchema using appid:", appIds);
      // chaining two more api calls using the appids from the first call, looping through each game one by one
      const gameSchema = async (appIds: number[]) => {
        return await Promise.all(
          appIds.map(async (appid) => {
            await this.rateLimitDelay(300, 1000);
            return axios
              .get(
                `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?appid=${appid}&key=${this.steamApiKey}`
              )
              .then((res) => res.data)
              .catch((error) => {
                console.error(
                  `Error fetching schema for appid ${appid}:`,
                  error.response?.data || error.message
                );
                return null;
              });
          })
        );
      };

      const gameSchemaData = await gameSchema(appIds);
      console.log("gameSchemaData:", gameSchemaData);

      const gameDetails = async (appIds: number[]) => {
        return await Promise.all(
          appIds.map(async (appid) => {
            await this.rateLimitDelay(300, 1000);
            return axios
              .get(`https://store.steampowered.com/api/appdetails`, {
                params: { appids: appid },
              })
              .then((res) => res.data[appid]?.data || null)
              .catch((error) => {
                console.error(
                  `Error fetching details for appid ${appid}:`,
                  error.response?.data || error.message
                );
                return null;
              });
          })
        );
      };

      const combinedGameData = games.map((game, index) => {
        return {
          ...game,
          schema: gameSchemaData[index] || {},
          details: gameDetails[index] || {},
        };
      });

      console.log("Combined game data:", combinedGameData);

      for (const game of combinedGameData) {
        // upsert is a sequelize function. It updates the entry if it exists, otherwise it will create a new one
        await Game.upsert({
          appid: game.appid,
          gameName: game.name,
          genres: game.details?.genres || [],
          headerImage: game.details?.header_image || "",
          screenshots: game.details?.screenshots || [],
          developers: game.details?.developers || "",
          metacritic: game.details?.metacritic?.score || null,
        });
      }

      console.log("Games stored in database successfully.");
      return combinedGameData;
    } catch (error) {
      console.error("Error fetching or storing game data:", error);
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
