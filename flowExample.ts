import axios from 'axios';
import { connection } from './src/db/config.js';
import { RowDataPacket } from 'mysql2/promise.js';

const steamApiKey = process.env.steamApiKey;
const steamid = process.env.steamid;

// A "blueprint", it defines what should be included in an object that
// claims to be a User.
// property: type; (strict, must include)
// property?: type; (data is optional)
interface Profile extends RowDataPacket {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatarfull: string;
    loccountrycode?: string;
    timecreated?: number;
}

// Service is getting data from an external api
// awaits the data before moving on
// casting response.data as Profile[] to tell typescript to expect an array of Profile objects
// sql query using 'parameterized' values (?) to prevent sql injection attacks (look into that)
// connection.execute runs the query with the profiles values inserted into the placeholders
export class ProfileService {
    async fetchAndStoreUsers(): Promise<void> {
        const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamIds=${steamid}`)
        const profiles: Profile[] = response.data;

        const query = 'INSERT INTO profiles (steamid, personaname, profileurl, avatarfull, loccountrycode, timecreated) VALUES (?, ?, ?, ?, ?, ?)';
        for (const profile of profiles) {
            await connection.execute(query, 
                [
                profile.steamid, 
                profile.personaname, 
                profile.profileurl, 
                profile.avatarfull, 
                profile.loccountrycode, 
                profile.timecreated
            ]);
        }
    }

    // Promise is saying that it will eventually return an array of Profile objects
    // connection.query sends the query to the database
    // SELECT * is telling mysql to retrieve all columns from the profile table with *
    // Alternatively use SELECT peram, peram, peram FROM profiles for specific columns
    // [rows] grabs the first element and ignores metadata
    // as Profile[] is telling typescript that the data should match the interface defined above
    async getProfiles(): Promise<Profile[]> {
        const [ rows ] = await connection.query[Symbol.iterator]()<Profile[]>('SELECT * FROM profiles');
        return rows;
    }
};