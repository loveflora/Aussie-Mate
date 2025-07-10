const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MarketplaceItem = sequelize.define('MarketplaceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('selling', 'buying', 'free', 'completed'),
    allowNull: false,
    defaultValue: 'selling'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Product category (e.g., furniture, electronics, clothing)'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'General location for meetup/pickup'
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Australian state/territory'
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Location coordinates'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of image paths (at least one required)'
  },
  isNegotiable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('available', 'reserved', 'sold'),
    defaultValue: 'available'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  favorites: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = MarketplaceItem;
