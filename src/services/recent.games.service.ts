import axios from "axios";
import dotenv from "dotenv";
import RecentGame from "../models/recent.games.model.js";
import { rateLimitDelay } from "../utils.js";
dotenv.config();

interface Screenshot {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

interface GameScreenshotsResponse {
  [appid: string]: {
    success: boolean;
    data?: {
      screenshots?: Screenshot[];
    };
  };
}

interface CombinedGameData {
  steamId: string;
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  headerImage: string;
  screenshots?: Screenshot[];
}

interface SteamGameResponse {
  response: {
    game_count: number;
    games: any[];
  };
}

export class RecentGamesService {
  private steamApiKey: string;

  constructor() {
    this.steamApiKey = process.env.steamApiKey || "";

    if (!this.steamApiKey) {
      throw new Error("Steam API key not found in environment variables");
    }
  }

  async fetchGameScreenshots(appid: number): Promise<Screenshot[] | null> {
    try {
      console.log(`Fetching screenshots for game ${appid}`);
      const { data } = await axios.get<GameScreenshotsResponse>(
        `https://store.steampowered.com/api/appdetails`,
        {
          params: {
            appids: appid,
            filters: "screenshots",
          },
        }
      );

      // Check if data exists and has the expected structure
      if (
        data &&
        data[appid] &&
        data[appid].success &&
        data[appid].data?.screenshots
      ) {
        return data[appid].data.screenshots;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching screenshots for game ${appid}:`, error);
      return null;
    }
  }

  async fetchRecentGames(steamId: string): Promise<RecentGame[] | null> {
    console.log("Fetching recent Steam games for steamId:", steamId);
    try {
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
          steamId: steamId,
          appid: game.appid,
          name: game.name || "Unknown Game",
          playtime_2weeks: game.playtime_2weeks || 0,
          playtime_forever: game.playtime_forever || 0,
          headerImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
          screenshots: [],
        })
      );

      // Fetch screenshots for each game, with rate limiting
      for (const game of recentGameData) {
        await rateLimitDelay(300, 700);
        const screenshots = await this.fetchGameScreenshots(game.appid);
        game.screenshots = screenshots || [];
      }

      await rateLimitDelay(300, 700);
      console.log("Fetch recent games finished");

      // Upsert games with screenshots
      await Promise.all(
        recentGameData.map((game) =>
          RecentGame.upsert({
            steamId: steamId,
            appid: game.appid,
            name: game.name,
            playtime_2weeks: game.playtime_2weeks,
            playtime_forever: game.playtime_forever,
            headerImage: game.headerImage,
            screenshots: game.screenshots || [],
          })
        )
      );

      console.log(
        "Recent games with screenshots stored in database successfully."
      );

      return RecentGame.findAll({
        where: { steamId: steamId, appid: recentGameData.map((g) => g.appid) },
      });
    } catch (error) {
      console.error("Error fetching recent games:", error);
      throw error;
    }
  }

  async getRecentGames(steamId: string): Promise<RecentGame[]> {
    try {
      return await RecentGame.findAll({ where: { steamId: steamId } });
    } catch (error) {
      console.error("Error retrieving recent games:", error);
      throw error;
    }
  }
}
