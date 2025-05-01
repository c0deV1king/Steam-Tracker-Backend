import axios from "axios";
import dotenv from "dotenv";
import Achievement from "../models/achievements.model.js";
import Game from "../models/games.model.js";
import sequelize from "../db/db.js";
dotenv.config();

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

    // const gameName = gameSchema.gameName;

    // const existingAchievements = await Achievement.findOne({
    //   where: { gameName: gameName },
    // });

    // if (existingAchievements) {
    //   console.log(
    //     `Achievements for gameName "${gameName}" already exist. Skipping upsert.`
    //   );
    //   return [];
    // }

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

      console.log(
        "Global Achievement Percentages:",
        globalAchievementPercentages
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

    for (const achievement of combinedAchievements) {
      await Achievement.upsert({
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
      });
    }

    return combinedAchievements;
  };

  async fetchAchievements(steamId: string): Promise<void> {
    console.log("Fetching acheivements for steamId:", steamId);
    try {
      await sequelize.sync({ force: false });

      const games = await Game.findAll({
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
            for (const achievement of achievements) {
              await Achievement.upsert({
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
              });
            }
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

  async getAchievements(): Promise<Achievement[]> {
    try {
      await sequelize.sync({ force: false });
      return await Achievement.findAll();
    } catch (error) {
      console.error("Error retrieving games:", error);
      throw error;
    }
  }
}
