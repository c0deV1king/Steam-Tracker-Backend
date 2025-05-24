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

  async getGames(steamId: string): Promise<Game[]> {
    try {
      return await Game.findAll({ where: { steamId: steamId } });
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
