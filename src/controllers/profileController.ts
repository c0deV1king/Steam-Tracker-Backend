import { Request, Response } from 'express';
import { PlayerSummary } from '../services/getPlayerSummary.js';

export class ProfileController {
    private playerSummary: PlayerSummary;

    constructor() {
        this.playerSummary = new PlayerSummary();
        console.log('Profile Controller initialized');
    }

    updateProfile = async (req: Request, res: Response) => {
        console.log('Update profile called');
        try {
            console.log('Updating profile');
            await this.playerSummary.fetchAndStoreUsers();
            res.status(200).json({ message: 'Profile updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    getProfiles = async (req: Request, res: Response) => {
        console.log('Get profiles called');
        try {
            const profiles = await this.playerSummary.getProfiles();
            res.status(200).json(profiles);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve profiles' });
        }
    }
}