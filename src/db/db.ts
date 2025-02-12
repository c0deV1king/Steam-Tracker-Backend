import { Sequelize } from "sequelize-typescript";
import Profile from "../models/Profile.js";
import config from "../db/config.js";

const sequelize = new Sequelize({
    ...config,
    dialect: "mysql",
    models: [Profile],
});

export default sequelize;
