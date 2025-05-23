import { Request, Response, Router } from "express";
import { AchievementsService } from "../services/achievements.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export class AchievementsController {
  private achievementsService: AchievementsService;
  public route: Router;

  constructor() {
    this.achievementsService = new AchievementsService();
    this.route = Router();
    this.initializeRoutes();
    console.log("Achievement Controller initialized");
  }

  private initializeRoutes() {
    this.route.patch(
      "/update/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update achievements called");
        try {
          console.log("Updating achievements");
          const { steamId } = req.params;
          await this.achievementsService.fetchAchievements(steamId);
          // logs the updated results
          res.status(200).json({
            message: `Achievements updated successfully`,
          });
        } catch (error) {
          console.error("Failed to retrieve achievements:", error);
          res.status(500).json({ error: "Failed to update achievements" });
        }
      }
    );

    this.route.patch(
      "/update/:steamId/appid/:appid",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update achievements called");
        try {
          console.log("Updating achievements");
          const { steamId, appid } = req.params;
          const updatedAchievements =
            await this.achievementsService.processAppId(
              parseInt(appid),
              steamId
            );
          // logs the updated results
          res.status(200).json({
            message: `Achievements updated successfully`,
            achievements: updatedAchievements,
          });
        } catch (error) {
          console.error("Failed to retrieve achievements:", error);
          res.status(500).json({ error: "Failed to update achievements" });
        }
      }
    );

    this.route.get(
      "/update/appid/:appid/steamid/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update achievements by appid called");
        try {
          const { appid, steamId } = req.params;

          const achievements = await this.achievementsService.processAppId(
            parseInt(appid),
            steamId
          );
          res.status(200).json({
            message: `Achievements fetched successfully for appid: ${appid}`,
            achievements,
          });
        } catch (error) {
          console.error("Failed to retrieve achievements:", error);
          res.status(500).json({
            error: `Failed to retrieve achievements for appid: ${req.params.appid}`,
          });
        }
      }
    );

    this.route.get(
      "/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Get achievements called");
        try {
          const { steamId } = req.params;
          const achievements = await this.achievementsService.getAchievements(
            steamId
          );
          res.status(200).json(achievements);
        } catch (error) {
          console.error("Failed to retrieve achievements:", error);
          res.status(500).json({ error: "Failed to retrieve Achievements" });
        }
      }
    );
  }
}
