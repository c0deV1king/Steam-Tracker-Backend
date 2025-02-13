import { Sequelize } from "sequelize-typescript";
import Profile from "../models/Profile.js";
import dbConfig from "../db/config.js";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize({
    // ... is spreading out the dbConfig object
    // makes it look cleaner. Connected to config.ts in db
    // or hover over dbConfig to see the object
    ...dbConfig,
    dialect: "mysql",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    models: [Profile],
});

export default sequelize;