import axios from "axios";
import dotenv from "dotenv";
import RecentGame from "../models/recent.games.model.js";
import sequelize from "../db/db.js";
dotenv.config();

interface CombinedGameData {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  headerImage: string;
}

interface SteamGameResponse {
  response: {
    game_count: number;
    games: any[];
  };
}

export class RecentGamesService {
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

  async fetchRecentGames(steamId: string): Promise<RecentGame[] | null> {
    console.log("Fetching recent Steam games for steamId:", steamId);
    try {
      await sequelize.sync();
      const { data: allRecentGamesResponse } =
        await axios.get<SteamGameResponse>(
          `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/`,
          {
            params: {
              key: this.steamApiKey,
              steamid: steamId,
            },
          }
        );
      const recentGames = allRecentGamesResponse.response.games || [];

      if (recentGames.length === 0) return null;

      const recentGameData: CombinedGameData[] = recentGames.map(
        (game: any) => ({
          appid: game.appid,
          name: game.name || "Unknown Game",
          playtime_2weeks: game.playtime_2weeks || 0,
          playtime_forever: game.playtime_forever || 0,
          headerImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
        })
      );

      await this.rateLimitDelay(300, 700);
      console.log("Fetch recent games finished");

      await Promise.all(
        recentGameData.map((game) =>
          RecentGame.upsert({
            appid: game.appid,
            name: game.name,
            playtime_2weeks: game.playtime_2weeks,
            playtime_forever: game.playtime_forever,
            headerImage: game.headerImage,
          })
        )
      );

      console.log("Recent games stored in database successfully.");

      return RecentGame.findAll({
        where: { appid: recentGameData.map((g) => g.appid) },
      });
    } catch (error) {
      console.error("Error fetching recent games:", error);
      throw error;
    }
  }

  async getRecentGames(): Promise<RecentGame[]> {
    try {
      await sequelize.sync({ force: false });
      return await RecentGame.findAll();
    } catch (error) {
      console.error("Error retrieving recent games:", error);
      throw error;
    }
  }
}
