import axios from "axios";
import dotenv from "dotenv";
import Achievement from "../models/achievements.model.js";
import Game from "../models/games.model.js";
dotenv.config();

export class AchievementsService {
  private steamApiKey: string;

  constructor() {
    this.steamApiKey = process.env.steamApiKey || "";

    if (!this.steamApiKey) {
      throw new Error("Steam API key not found in environment variables");
    }
  }

  rateLimitDelay = (min: number, max: number): Promise<void> => {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.random() * (max - min) + min)
    );
  };

  processAppId = async (appid: number, steamId: string) => {
    console.log("Processing appid:", appid, "for steamId:", steamId);

    const gameSchemaUrl = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/`;
    const gameSchemaParams = {
      key: this.steamApiKey,
      appid: appid,
    };

    const { data: gameSchemaResponse } = await axios.get(gameSchemaUrl, {
      params: gameSchemaParams,
    });

    const gameSchema = gameSchemaResponse.game || {};

    const achievements = gameSchema.availableGameStats?.achievements || [];

    if (achievements.length === 0) {
      console.log(`No achievements found for appid: ${appid}`);
      return [];
    }

    const playerAchievementsUrl = `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/`;
    const playerAchievementsParams = {
      key: this.steamApiKey,
      steamid: steamId,
      appid: appid,
    };

    const { data: playerAchievementsResponse } = await axios.get(
      playerAchievementsUrl,
      {
        params: playerAchievementsParams,
      }
    );

    const playerAchievements = playerAchievementsResponse.playerstats || {};

    const globalAchievementPercentagesUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`;
    const globalAchievementPercentagesParams = {
      key: this.steamApiKey,
      gameid: appid,
    };

    const { data: globalAchievementPercentagesResponse } = await axios.get(
      globalAchievementPercentagesUrl,
      {
        params: globalAchievementPercentagesParams,
      }
    );

    const globalAchievementPercentages =
      globalAchievementPercentagesResponse.achievementpercentages
        ?.achievements || [];

    const combinedAchievements = (achievements || []).map((achievement) => {
      const playerAchievement = (playerAchievements || []).achievements.find(
        (a: any) => a.apiname === achievement.name
      );

      const globalAchievement = globalAchievementPercentages.find(
        (g: any) => g.name === achievement.name
      );

      return {
        appid: appid,
        gameName: playerAchievements.gameName,
        name: achievement.name,
        apiname: achievement.name,
        displayName: achievement.displayName,
        hidden: achievement.hidden,
        description: achievement.description,
        icon: achievement.icon,
        iconGray: achievement.icongray,
        achieved: playerAchievement?.achieved || 0,
        unlockTime: playerAchievement?.unlocktime || 0,
        percent: globalAchievement?.percent || 0,
      };
    });

    return combinedAchievements;
  };

  async fetchAchievements(steamId: string): Promise<void> {
    console.log("Fetching acheivements for steamId:", steamId);
    try {
      const games = await Game.findAll({
        where: { steamId: steamId },
        attributes: ["appid"],
      });

      for (const game of games) {
        try {
          if (!game.appid) {
            console.log("Skipping undefined or null appid.");
            continue;
          }

          await this.rateLimitDelay(200, 500);

          const achievements = await this.processAppId(game.appid, steamId);

          if (achievements.length > 0) {
            await Achievement.bulkCreate(
              achievements.map((achievement: any) => ({
                steamId: steamId,
                appid: game.appid,
                gameName: achievement.gameName,
                name: achievement.name,
                apiname: achievement.apiname,
                achieved: achievement.achieved,
                unlocktime: achievement.unlockTime,
                displayName: achievement.displayName,
                hidden: achievement.hidden,
                description: achievement.description,
                icon: achievement.icon,
                icongray: achievement.iconGray,
                percent: achievement.percent,
              })),
              {
                updateOnDuplicate: [
                  "steamId",
                  "appid",
                  "gameName",
                  "name",
                  "apiname",
                  "achieved",
                  "unlocktime",
                  "displayName",
                  "hidden",
                  "description",
                  "icon",
                  "icongray",
                  "percent",
                ],
              }
            );
          } else {
            console.log(`No achievements found for appid: ${game.appid}`);
          }
        } catch (error: any) {
          if (error.response?.status === 403) {
            console.log(
              `Skipping appid ${game.appid} due to 403 Forbidden. Game details incomplete`
            );
          } else {
            console.error(
              `Error processing appid ${game.appid}:`,
              error.message
            );
          }
        }
      }

      console.log("Achievements stored in database successfully.");
    } catch (error) {
      console.error("Error fetching achievements:", error);
      throw error;
    }
  }

  async getAchievements(steamId: string): Promise<Achievement[]> {
    try {
      return await Achievement.findAll({ where: { steamId: steamId } });
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
