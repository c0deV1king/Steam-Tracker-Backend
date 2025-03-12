import { Table, Column, Model, DataType } from "sequelize-typescript";

interface Screenshot {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

interface Genres {
  id: string;
  description: string;
}

interface GameAttributes {
  appid: number;
  playtime_forever?: number;
  gameName: string;
  genres: Genres[];
  headerImage: string;
  screenshots?: Screenshot[];
  developers?: string;
  metacritic?: number;
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
    type: DataType.INTEGER,
    allowNull: false,
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
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  screenshots?: Screenshot[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  developers?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  metacritic?: number;
}
