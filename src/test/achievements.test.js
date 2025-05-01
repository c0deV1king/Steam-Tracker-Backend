import AchievementsService from "../services/achievements.service.js";

const testAppId = async (appid) => {
  const achievementsService = new AchievementsService();

  try {
    const achievements = await achievementsService.processAppId(appid);
    console.log(`Achievements for appid ${appid}:`, achievements);
  } catch (error) {
    console.error(`Error fetching achievements for appid ${appid}:`, error);
  }
};

// Replace with the appid you want to test
const appid = 230410; // Example: Warframe
testAppId(appid);
