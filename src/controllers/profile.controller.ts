import { Request, Response, Router } from "express";
import { ProfileService } from "../services/profile.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

// creating a profile class
// https://www.slingacademy.com/article/typescript-class-constructor-complete-guide/
// https://www.w3schools.com/typescript/typescript_classes.php

export class ProfileController {
  private profileService: ProfileService;
  public route: Router;

  constructor() {
    this.profileService = new ProfileService();
    this.route = Router();
    this.initializeRoutes();
    console.log("Profile Controller initialized");
  }

  private initializeRoutes() {
    this.route.patch(
      "/update/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Update profile called");
        try {
          console.log("Updating profile");
          const { steamId } = req.params;
          const updatedProfile = await this.profileService.updateProfile(
            steamId
          );
          // logs the updated results
          res.status(200).json({
            message: `Profile updated successfully`,
            profile: updatedProfile,
          });
        } catch (error) {
          res.status(500).json({ error: "Failed to update profile" });
        }
      }
    );

    this.route.get(
      "/:steamId",
      authMiddleware,
      async (req: Request, res: Response) => {
        console.log("Get profiles called");
        try {
          const { steamId } = req.params;
          const profiles = await this.profileService.getProfiles(steamId);
          res.status(200).json(profiles);
        } catch (error) {
          res.status(500).json({ error: "Failed to retrieve profiles" });
        }
      }
    );
  }
}
