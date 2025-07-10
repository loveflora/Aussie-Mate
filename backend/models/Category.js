const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '카테고리 아이콘 이름 또는 경로'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '카테고리 색상 코드(예: #FF5733)'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '카테고리 표시 순서'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Category;
