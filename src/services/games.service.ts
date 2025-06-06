import axios from "axios";
import dotenv from "dotenv";
import Game from "../models/games.model.js";
dotenv.config();

interface SteamGameResponse {
  response: {
    game_count: number;
    games: any[];
  };
}

interface SteamAppDetailsResponse {
  [appid: string]: {
    success: boolean;
    data?: {
      developers?: string[];
      publishers?: string[];
      genres?: { description: string }[];
      categories?: { description: string }[];
    };
  };
}

export class GamesService {
  private steamApiKey: string;

  constructor() {
    this.steamApiKey = process.env.steamApiKey || "";

    if (!this.steamApiKey) {
      throw new Error("Steam API key not found in environment variables");
    }
  }

  async fetchGames(steamId: string): Promise<Game[] | null> {
    console.log("Fetching Steam games for steamId:", steamId);
    try {
      const { data: allGamesResponse } = await axios.get<SteamGameResponse>(
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

      const gamesList = await Game.bulkCreate(
        games.map((game) => ({
          steamId: steamId,
          appid: game.appid,
          gameName: game.name || "Unknown Game",
          playtime_forever: game.playtime_forever || 0,
          headerImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
          genres: game.genres || [],
          developers: game.developers ? game.developers.join(", ") : undefined,
          publishers: game.publishers ? game.publishers.join(", ") : undefined,
        })),
        {
          updateOnDuplicate: ["gameName", "playtime_forever", "headerImage"],
        }
      );

      console.log("Games stored in database successfully.");
      return gamesList;
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }

  async fetchExtraGameDetails(appid: string, steamId: string): Promise<void> {
    try {
      const { data: appDetailsResponse } =
        await axios.get<SteamAppDetailsResponse>(
          `https://store.steampowered.com/api/appdetails`,
          {
            params: {
              appids: appid,
            },
          }
        );

      const gameData = appDetailsResponse[appid.toString()];

      if (!gameData || !gameData.success || !gameData.data) {
        console.log(`No additional details found for appid: ${appid}`);
        return;
      }

      const details = gameData.data;

      // Update the existing game record with additional details
      const [updatedCount] = await Game.update(
        {
          developers: details.developers
            ? details.developers.join(", ")
            : undefined,
          publishers: details.publishers
            ? details.publishers.join(", ")
            : undefined,
          genres: details.genres
            ? details.genres.map((genre, index) => ({
                id: index.toString(),
                description: genre.description,
              }))
            : undefined,
          categories: details.categories
            ? details.categories.map((category, index) => ({
                id: index.toString(),
                description: category.description,
              }))
            : undefined,
        },
        {
          where: {
            appid: appid,
            steamId: steamId,
          },
        }
      );
      if (updatedCount > 0) {
        console.log(`Extra details updated for game with appid: ${appid}`);
      }
    } catch (error) {
      console.error(`Error fetching extra details for appid ${appid}:`, error);
      throw error;
    }
  }

  async getGames(steamId: string): Promise<Game[]> {
    try {
      return await Game.findAll({ where: { steamId: steamId } });
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
