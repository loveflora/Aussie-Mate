const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// MySQL 연결 정보 가져오기
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// MySQL로 Sequelize 인스턴스 생성
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false
  },
  // 연결 오류 발생시 SQLite로 폴백 (선택사항)
  dialectOptions: {
    // 연결 제한 시간 설정
    connectTimeout: 60000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
