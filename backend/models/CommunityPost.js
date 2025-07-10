const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommunityPost = sequelize.define('CommunityPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Australian state/territory'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'id'
    },
    comment: 'Foreign key to Category model'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image paths'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of tags'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Is post pinned to top'
  },
  isAnnouncement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Is official announcement'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'reported', 'removed'),
    defaultValue: 'active'
  }
});

module.exports = CommunityPost;
