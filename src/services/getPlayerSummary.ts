import axios from "axios";
import dotenv from "dotenv";
import Profile from "../models/Profile.js";
import sequelize from '../db/db.js';
dotenv.config();

export class PlayerSummary {
    private steamApiKey: string;
    private steamid: string;

    constructor() {
        this.steamApiKey = process.env.steamApiKey || '';
        this.steamid = process.env.steamid || '';

        if (!this.steamApiKey || !this.steamid) {
            throw new Error('Steam API key or Steam ID not found in environment variables');
        }
    }

    async fetchAndStoreUsers(): Promise<void> {
        try {
            const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                params: {
                    key: this.steamApiKey,
                    steamids: this.steamid
                }
            });

            // Steam API returns players array inside response object
            const profile = response.data.response.players[0];

            // Use your Sequelize Profile model to create/update
            await Profile.create({
                steamid: profile.steamid,
                personaname: profile.personaname,
                profileurl: profile.profileurl,
                avatarfull: profile.avatarfull,
                loccountrycode: profile.loccountrycode,
                timecreated: profile.timecreated
            });

        } catch (error) {
            console.error('Error fetching or storing Steam profile:', error);
            throw error;
        }
    }

    async getProfiles(): Promise<Profile[]> {
        try {
            console.log(Profile === Profile);
            console.log('Sequelize Models:', sequelize.models);
            console.log('Is Profile Initialized:', Profile.isInitialized);
            return await Profile.findAll();
        } catch (error) {
            console.error('Error retrieving profiles:', error);
            throw error;
        }
    }
}