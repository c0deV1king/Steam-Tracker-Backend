import { Table, Column, Model, DataType } from "sequelize-typescript";

interface AchievementAttributes {
  steamId: string;
  appid: number;
  gameName: string;
  name: string;
  apiname: string;
  achieved: number;
  unlocktime: number;
  defaultvalue?: number;
  displayName: string;
  hidden?: number;
  description?: string;
  icon: string;
  icongray: string;
  percent: string;
}

@Table({
  tableName: "achievements",
  modelName: "Achievement",
})
export default class Achievement
  extends Model<AchievementAttributes>
  implements AchievementAttributes
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
    type: DataType.STRING,
    allowNull: false,
  })
  gameName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    primaryKey: true,
  })
  apiname!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  achieved!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  unlocktime!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  defaultvalue?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  displayName!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  hidden?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  icon!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  icongray!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  percent!: string;
}
