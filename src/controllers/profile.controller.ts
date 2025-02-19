import { Request, Response, Router } from 'express';
import { profileService } from '../services/profile.service.js';

// creating a profile class
// https://www.slingacademy.com/article/typescript-class-constructor-complete-guide/
// https://www.w3schools.com/typescript/typescript_classes.php

export class ProfileController {
    private profileService: profileService;
    public route: Router;

    constructor() {
        this.profileService = new profileService();
        this.route = Router();
        this.initializeRoutes();
        console.log('Profile Controller initialized');
    }

    // creating the routes to get and update your profile using an endpoint
    // patch is used to update and store the data
    // get is used to retrieve the data
    private initializeRoutes() {
        this.route.patch(
            "/update/:steamid",
            async (req: Request, res: Response) => {
                console.log('Update profile called');
                try {
                    console.log('Updating profile');
                    const { steamid } = req.params;
                    const { body } = req;
                    // initializes a profileService instance and calls the
                    // updateProfile method with the steamid and body parameters
                    const updatedProfile = await this.profileService.updateProfile(
                        steamid,
                        body
                    );
                    // logs the updated results
                    res.status(200).json({ message: `Profile updated successfully`, profile: updatedProfile });
                } catch (error) {
                    res.status(500).json({ error: 'Failed to update profile' });
                }
            }
        );

        this.route.get(
            "/",
            async (req: Request, res: Response) => {
                console.log('Get profiles called');
                try {
                    const profiles = await this.profileService.getProfiles();
                    res.status(200).json(profiles);
                } catch (error) {
                    res.status(500).json({ error: 'Failed to retrieve profiles' });
                }
            }
        );
    }
}