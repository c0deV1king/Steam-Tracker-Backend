import { Sequelize } from "sequelize-typescript";
import Profile from "../models/Profile.js";
import dbConfig from "../db/config.js";
import dotenv from "dotenv";
dotenv.config();

console.log("DB CONFIG CONTENT: ", dbConfig);
const sequelize = new Sequelize({
    //...dbConfig,
    database: process.env.DATABASE as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT || 3306),
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