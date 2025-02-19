import axios from "axios";
import dotenv from "dotenv";
import Profile from "../models/profile.model.js";
import sequelize from '../db/db.js';
dotenv.config();

// 'this.' is used to access class properties inside of the specific class instance.
export class profileService {
    // private only accessible within the class
    private steamApiKey: string;
    private steamId: string;

    constructor() {
        this.steamApiKey = process.env.steamApiKey || '';
        this.steamId = process.env.steamId || '';

        if (!this.steamApiKey || !this.steamId) {
            throw new Error('Steam API key or Steam ID not found in environment variables');
        }
    }

    // fetches and stores the profile data into the database
    async updateProfile(steamid: string, body: any): Promise<Profile | null> {
        console.log('Fetching Steam profile');
        try {
            // fetch request with axios
            const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                // params is an object that will append the contents into the above url, axios feature.
                params: {
                    key: this.steamApiKey,
                    steamids: this.steamId
                }
            });
            console.log('Response:', response.data);

            // grabbing the retrieved profile data
            const profile = response.data.response.players[0];

            // finding a profile to see if it exists in the database based on the steam id
            const existingProfile = await Profile.findOne({ where: { steamId: profile.steamid } });

            // storing the profile data into the correct database columns
            // using the Profile model defined with Sequelize
            // connected to Profile.ts in models

            // if else. Checks if existingProfile found an entry.
            // if a row exists, it updates the entire row rather than creating one.
            if (existingProfile) {
                await Profile.update({
                    personaName: profile.personaname,
                    profileUrl: profile.profileurl,
                    avatarFull: profile.avatarfull,
                    locCountryCode: profile.loccountrycode,
                    timeCreated: profile.timecreated
                }, { where: { steamId: profile.steamid } });
                console.log('Profile exists updated');
                const updatedProfile = await Profile.findOne({ where: { steamId: profile.steamid } });
                return updatedProfile;
                
                // if no entry with the steam id exists, it creates one.
            } else {
                await Profile.create({
                    steamId: profile.steamid,
                    personaName: profile.personaname,
                    profileUrl: profile.profileurl,
                    avatarFull: profile.avatarfull,
                    locCountryCode: profile.loccountrycode,
                    timeCreated: profile.timecreated
                });
                console.log('Profile does not exist, created a new one');
                const updatedProfile = await Profile.findOne({ where: { steamId: profile.steamid } });
                return updatedProfile;
            };


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