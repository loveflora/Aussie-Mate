const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HousingPost = sequelize.define('HousingPost', {
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
    type: DataTypes.ENUM('rent', 'share', 'wanted'),
    allowNull: false,
    comment: 'Listing type: rent (entire property), share (room/share), or wanted (looking for)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Location coordinates for map display'
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Australian state/territory'
  },
  suburb: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postcode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Weekly rent price'
  },
  bond: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Bond/deposit amount'
  },
  availableFrom: {
    type: DataTypes.DATE,
    allowNull: false
  },
  minStay: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Minimum stay period (e.g., "3 months", "6 months")'
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  furnished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferredGender: {
    type: DataTypes.ENUM('any', 'male', 'female'),
    defaultValue: 'any',
    allowNull: true
  },
  petsAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  utilities: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Utilities included in rent'
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of available amenities'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of image paths (at least one required)'
  },
  contactMethod: {
    type: DataTypes.ENUM('phone', 'email', 'chat'),
    allowNull: false,
    defaultValue: 'chat'
  },
  contactDetails: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'pending', 'leased'),
    defaultValue: 'available'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = HousingPost;
