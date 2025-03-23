import { Request, Response, Router } from "express";
import { AchievementsService } from "../services/achievements.service.js";

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
      async (req: Request, res: Response) => {
        console.log("Update achievements called");
        try {
          console.log("Updating achievements");
          const { steamId } = req.params;
          const updatedGames = await this.gamesService.fetchGames(steamId);
          // logs the updated results
          res.status(200).json({
            message: `Games updated successfully`,
            games: updatedGames,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update games" });
        }
      }
    );

    this.route.get("/", async (req: Request, res: Response) => {
      console.log("Get games called");
      try {
        const games = await this.gamesService.getGames();
        res.status(200).json(games);
      } catch (error) {
        res.status(500).json({ error: "Failed to retrieve games" });
      }
    });
  }
}
