import axios from "axios";
import dotenv from "dotenv";
import Profile from "../models/profile.model.js";
dotenv.config();

export class ProfileService {
  private steamApiKey: string;

  constructor() {
    this.steamApiKey = process.env.steamApiKey || "";

    if (!this.steamApiKey) {
      throw new Error(
        "Steam API key or Steam ID not found in environment variables"
      );
    }
  }

  async updateProfile(steamId: string): Promise<Profile | null> {
    console.log("Fetching Steam profile for steamId:", steamId);
    try {
      // fetch request with axios
      const response = await axios.get(
        `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: this.steamApiKey,
            steamids: steamId,
          },
        }
      );
      console.log("Response:", response.data);

      const profile = response.data.response.players[0];
      console.log("Profile:", profile);

      const [userProfile, created] = await Profile.upsert({
        steamId: profile.steamid,
        personaName: profile.personaname,
        profileUrl: profile.profileurl,
        avatarFull: profile.avatarfull,
        locCountryCode: profile.loccountrycode,
        timeCreated: profile.timecreated,
      });

      console.log(created ? "Profile created" : "Profile updated");
      return userProfile;
    } catch (error) {
      console.error("Error fetching or storing Steam profile:", error);
      throw error;
    }
  }

  async getProfiles(steamId: string): Promise<Profile[]> {
    try {
      return await Profile.findAll({ where: { steamId: steamId } });
    } catch (error) {
      console.error("Error retrieving profiles:", error);
      throw error;
    }
  }
}
