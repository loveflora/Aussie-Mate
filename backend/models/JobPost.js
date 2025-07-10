const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const JobPost = sequelize.define('JobPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('hiring', 'seeking'),
    allowNull: false,
    comment: 'Post type: hiring (구인) or seeking (구직)'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Company or business name'
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Job position (e.g., kitchen hand, house keeping)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Job location address'
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
  salary: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Hourly rate or salary range'
  },
  workDays: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Working days'
  },
  workHours: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Working hours'
  },
  experienceRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  jobDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed job description'
  },
  visaRequirements: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Visa types accepted'
  },
  contactMethod: {
    type: DataTypes.ENUM('phone', 'email', 'chat'),
    allowNull: false,
    defaultValue: 'email'
  },
  contactDetails: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image paths'
  },
  externalLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'filled', 'closed'),
    defaultValue: 'active'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = JobPost;
