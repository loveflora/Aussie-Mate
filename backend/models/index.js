// 데이터베이스 연결과 모델 정의
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// 모델 가져오기
const User = require('./User');
const JobPost = require('./JobPost');
const HousingPost = require('./HousingPost');
const MarketplaceItem = require('./MarketplaceItem');
const TravelPost = require('./TravelPost');
const CommunityPost = require('./CommunityPost');
const Meetup = require('./Meetup');
const Chat = require('./Chat');
const ChatMessage = require('./ChatMessage');
const VisaPostcode = require('./VisaPostcode');

// 새로운 커뮤니티 모델들 정의
// Comment 모델 정의
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'CommunityPosts',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'reported'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['postId'] },
    { fields: ['parentId'] }
  ]
});

// Like 모델 정의
const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'CommunityPosts',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'],
      name: 'likes_user_post_unique'
    }
  ]
});

// Category 모델 정의
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
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// User Associations
User.hasMany(JobPost, { foreignKey: 'userId', as: 'jobPosts' });
User.hasMany(HousingPost, { foreignKey: 'userId', as: 'housingPosts' });
User.hasMany(MarketplaceItem, { foreignKey: 'userId', as: 'marketplaceItems' });
User.hasMany(TravelPost, { foreignKey: 'userId', as: 'travelPosts' });
User.hasMany(CommunityPost, { foreignKey: 'userId', as: 'communityPosts' });
User.hasMany(Meetup, { foreignKey: 'organizerId', as: 'organizedMeetups' });
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });

// Meetup Associations
Meetup.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });
Meetup.belongsToMany(User, { through: 'MeetupParticipants', as: 'participants' });

// Post Associations
JobPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
HousingPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MarketplaceItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TravelPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CommunityPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category Associations
Category.hasMany(CommunityPost, { foreignKey: 'categoryId', as: 'posts' });
CommunityPost.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Comment Associations
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CommunityPost.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(CommunityPost, { foreignKey: 'postId', as: 'post' });

// Like Associations
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CommunityPost.hasMany(Like, { foreignKey: 'postId', as: 'postLikes' });
Like.belongsTo(CommunityPost, { foreignKey: 'postId', as: 'post' });

// Chat associations
Chat.belongsToMany(User, { through: 'ChatMembers', as: 'members' });
Chat.hasMany(ChatMessage, { foreignKey: 'chatId', as: 'messages' });
ChatMessage.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Save and bookmark associations
User.belongsToMany(JobPost, { through: 'SavedJobs', as: 'savedJobs' });
User.belongsToMany(HousingPost, { through: 'SavedHousing', as: 'savedHousing' });
User.belongsToMany(MarketplaceItem, { through: 'SavedMarketplaceItems', as: 'savedMarketplaceItems' });
User.belongsToMany(TravelPost, { through: 'SavedTravelPosts', as: 'savedTravelPosts' });
User.belongsToMany(CommunityPost, { through: 'SavedCommunityPosts', as: 'savedCommunityPosts' });
User.belongsToMany(Meetup, { through: 'SavedMeetups', as: 'savedMeetups' });

module.exports = {
  sequelize,
  User,
  JobPost,
  HousingPost,
  MarketplaceItem,
  TravelPost,
  CommunityPost,
  Meetup,
  Chat,
  ChatMessage,
  VisaPostcode,
  Category,
  Comment,
  Like
};
