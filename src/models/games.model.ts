import { Table, Column, Model, DataType } from "sequelize-typescript";

interface Genres {
  id: string;
  description: string;
}

interface Categories {
  id: string;
  description: string;
}

interface GameAttributes {
  steamId: string;
  appid: number;
  playtime_forever?: number;
  gameName: string;
  genres: Genres[];
  headerImage: string;
  developers?: string;
  publishers?: string;
  categories?: Categories[];
}

@Table({
  tableName: "games",
  modelName: "Game",
})
export default class Game
  extends Model<GameAttributes>
  implements GameAttributes
{
  @Column({
    type: DataType.STRING,
    allowNull: false,
    primaryKey: true,
  })
  steamId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
  })
  appid!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  playtime_forever?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  gameName!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  genres!: Genres[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  headerImage!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  developers?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  publishers?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  categories?: Categories[];
}
