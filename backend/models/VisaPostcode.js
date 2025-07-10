const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VisaPostcode = sequelize.define('VisaPostcode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postcode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.ENUM('VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'),
    allowNull: false
  },
  suburb: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Postcode center coordinates { latitude, longitude }'
  },
  polygonData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'GeoJSON polygon data for map display'
  },
  whv417RegionalEligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Eligible for Working Holiday 417 Regional visa'
  },
  whv417RemoteEligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Eligible for Working Holiday 417 Remote visa'
  },
  visa491Eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Eligible for Skilled Work Regional (Provisional) 491 visa'
  },
  visa190Eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Eligible for Skilled Nominated 190 visa'
  }
});

module.exports = VisaPostcode;
