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

    private initializeRoutes() {
        this.route.patch(
            "/update/:steamid",
            async (req: Request, res: Response) => {
                console.log('Update profile called');
                try {
                    console.log('Updating profile');
                    const { id } = req.params;
                    const { body } = req;
                    const updatedProfile = await this.profileService.updateProfile(
                        id,
                        body
                    );
                    res.status(200).json({ message: `Profile updated successfully: ${updatedProfile}` });
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