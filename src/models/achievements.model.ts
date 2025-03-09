import { Table, Column, Model, DataType } from "sequelize-typescript";

interface AchievementAttributes {
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
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  apiname!: string;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  achieved!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  unlocktime!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: true,
  })
  defaultvalue?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  displayName!: string;

  @Column({
    type: DataType.NUMBER,
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
}
