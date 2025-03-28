import { Table, Column, Model, DataType } from "sequelize-typescript";

interface RecentGameAttributes {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  headerImage: string;
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
}
