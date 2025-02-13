import { Optional } from "sequelize";
import { Table, Column, Model, DataType } from "sequelize-typescript";

// interface is a "blueprint", it is showing what each object should look like
// ?: is optional but : is required
interface ProfileAttributes {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatarfull: string;
    loccountrycode?: string;
    timecreated?: number;
}

@Table({
    tableName: "profiles",
    modelName: "Profile"
})
export default class Profile extends Model<ProfileAttributes> implements ProfileAttributes {
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    steamid!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    personaname!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    profileurl!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    avatarfull!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    loccountrycode?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    timecreated?: number;
};