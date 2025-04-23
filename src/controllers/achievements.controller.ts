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
          const updatedAchievements =
            await this.achievementsService.fetchAchievements(steamId);
          // logs the updated results
          res.status(200).json({
            message: `Achievements updated successfully`,
            achievements: updatedAchievements,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update achievements" });
        }
      }
    );

    this.route.get("/", authMiddleware, async (req: Request, res: Response) => {
      console.log("Get achievements called");
      try {
        const achievements = await this.achievementsService.getAchievements();
        res.status(200).json(achievements);
      } catch (error) {
        res.status(500).json({ error: "Failed to retrieve Achievements" });
      }
    });
  }
}
