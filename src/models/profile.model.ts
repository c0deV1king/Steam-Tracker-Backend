import { Optional } from "sequelize";
import { Table, Column, Model, DataType } from "sequelize-typescript";

// interface is a "blueprint", it is showing what each object should look like
// ?: is optional but : is required
interface ProfileAttributes {
    steamId: string;
    personaName: string;
    profileUrl: string;
    avatarFull: string;
    locCountryCode?: string;
    timeCreated?: number;
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
    steamId!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    personaName!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    profileUrl!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    avatarFull!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    locCountryCode?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    timeCreated?: number;
};