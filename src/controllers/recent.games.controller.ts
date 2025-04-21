import { Request, Response, Router } from "express";
import { RecentGamesService } from "../services/recent.games.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export class RecentGameController {
  private recentGamesService: RecentGamesService;
  public route: Router;

  constructor() {
    this.recentGamesService = new RecentGamesService();
    this.route = Router();
    this.initializeRoutes();
    console.log("Recent Games Controller initialized");
  }

  private initializeRoutes() {
    this.route.patch(
      "/update/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update recent games called");
        try {
          console.log("Updating recent games");
          const { steamId } = req.params;
          const updatedRecentGames =
            await this.recentGamesService.fetchRecentGames(steamId);
          // logs the updated results
          res.status(200).json({
            message: `Games updated successfully`,
            recentGames: updatedRecentGames,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update recent games" });
        }
      }
    );

    this.route.get(
      "/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Get recent games called");
        try {
          const recentGames = await this.recentGamesService.getRecentGames();
          res.status(200).json(recentGames);
        } catch (error) {
          res.status(500).json({ error: "Failed to retrieve recent games" });
        }
      }
    );
  }
}
