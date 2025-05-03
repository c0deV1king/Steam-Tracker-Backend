import { Table, Column, Model, DataType } from "sequelize-typescript";

export interface Screenshot {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

interface RecentGameAttributes {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  headerImage: string;
  screenshots?: Screenshot[] | null;
}

@Table({
  tableName: "recent games",
  modelName: "RecentGame",
})
export default class RecentGame
  extends Model<RecentGameAttributes>
  implements RecentGameAttributes
{
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true,
  })
  appid!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  playtime_2weeks!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  playtime_forever!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  headerImage!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  screenshots?: Screenshot[] | null;
}
