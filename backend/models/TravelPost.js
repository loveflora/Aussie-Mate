const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TravelPost = sequelize.define('TravelPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('info', 'companion', 'recommendation'),
    allowNull: false,
    comment: 'Post type: travel info, companion search, or place recommendation'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Travel destination'
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Australian state/territory if applicable'
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Location coordinates'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Travel start date (for companion posts)'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Travel end date (for companion posts)'
  },
  companionCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of companions wanted (for companion posts)'
  },
  preferences: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Preferences for companions (gender, age, etc.)'
  },
  category: {
    type: DataTypes.ENUM('nature', 'city', 'food', 'adventure', 'cultural', 'other'),
    allowNull: true,
    comment: 'Travel category'
  },
  cost: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Estimated cost or cost range'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image paths'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of tags related to the post'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = TravelPost;
