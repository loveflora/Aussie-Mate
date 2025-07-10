const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Meetup = sequelize.define('Meetup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('online', 'offline', 'hybrid'),
    allowNull: false,
    comment: 'Meeting type: online, offline, or hybrid'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Event category (sports, language exchange, etc.)'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Physical location for offline events'
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Australian state/territory'
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Location coordinates for map'
  },
  onlineLink: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Link for online meetings'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of participants'
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Event fee if applicable'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Event images'
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Pattern for recurring events (weekly, monthly, etc.)'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Meetup;
