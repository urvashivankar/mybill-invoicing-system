import { Model, DataTypes, Sequelize } from 'sequelize';

export class User extends Model {
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUser(sequelize: Sequelize) {
  User.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'User',
    indexes: [
      { unique: true, fields: ['email'] }
    ]
  });
}
