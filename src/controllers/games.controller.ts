import { Request, Response, Router } from "express";
import { GamesService } from "../services/games.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export class GameController {
  private gamesService: GamesService;
  public route: Router;

  constructor() {
    this.gamesService = new GamesService();
    this.route = Router();
    this.initializeRoutes();
    console.log("Games Controller initialized");
  }

  private initializeRoutes() {
    this.route.patch(
      "/update/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update games called");
        try {
          console.log("Updating games");
          const { steamId } = req.params;
          const updatedGames = await this.gamesService.fetchGames(steamId);
          res.status(200).json({
            message: `Games updated successfully`,
            games: updatedGames,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update games" });
        }
      }
    );

    this.route.patch(
      "/update/:appid/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update games called");
        try {
          console.log("Updating games");
          const { appid, steamId } = req.params;
          const updatedGames = await this.gamesService.fetchExtraGameDetails(
            appid,
            steamId
          );
          res.status(200).json({
            message: `Extra game details updated successfully`,
            games: updatedGames,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update games" });
        }
      }
    );

    this.route.get(
      "/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Get games called");
        try {
          const { steamId } = req.params;
          const games = await this.gamesService.getGames(steamId);
          res.status(200).json(games);
        } catch (error) {
          res.status(500).json({ error: "Failed to retrieve games" });
        }
      }
    );
  }
}
