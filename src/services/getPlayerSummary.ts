import axios from "axios";
import dotenv from "dotenv";
import Profile from "../models/Profile.js";
import sequelize from '../db/db.js';
dotenv.config();

// 'this.' is used to access class properties inside of the specific class instance.
export class PlayerSummary {
    // private only accessible within the class
    private steamApiKey: string;
    private steamid: string;

    constructor() {
        this.steamApiKey = process.env.steamApiKey || '';
        this.steamid = process.env.steamid || '';

        if (!this.steamApiKey || !this.steamid) {
            throw new Error('Steam API key or Steam ID not found in environment variables');
        }
    }

    // fetches and stores the profile data into the database
    async fetchAndStoreUsers(): Promise<void> {
        console.log('Fetching Steam profile');
        try {
            // fetch request with axios
            const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                // params is an object that will append the contents into the above url, axios feature.
                params: {
                    key: this.steamApiKey,
                    steamids: this.steamid
                }
            });
            console.log('Response:', response.data);

            // grabbing the retrieved profile data
            const profile = response.data.response.players[0];

            // storing the profile data into the correct database columns
            // using the Profile model defined with Sequelize
            // connected to Profile.ts in models
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

    // retrieves the profile data from the database, will find all profiles but in my app it will only display one. (Unless I login with multiple??)
    async getProfiles(): Promise<Profile[]> {
        try {
            // making sure everything is synced (unsure if I am using this correctly)
            sequelize.sync({force: false});
            return await Profile.findAll();
        } catch (error) {
            console.error('Error retrieving profiles:', error);
            throw error;
        }
    }
}