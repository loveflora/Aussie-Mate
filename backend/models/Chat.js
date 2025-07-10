const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    defaultValue: 'direct',
    comment: 'Chat type: direct (1:1) or group'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Title for group chats, null for direct chats'
  },
  lastMessageTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastMessagePreview: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  relatedPostType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of post that started this chat: job, housing, marketplace, etc.'
  },
  relatedPostId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the related post if chat is for a specific listing'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Chat;
