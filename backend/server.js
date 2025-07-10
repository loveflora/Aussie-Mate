const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const runSeeds = require('./seeds');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:19000', 'http://localhost:19001', 'http://localhost:19002', 'exp://localhost:19000', 'exp://10.0.2.2:19000', 'exp://127.0.0.1:19000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// 디버깅을 위한 요청 로그
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/housing', require('./routes/housing'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/travel', require('./routes/travel'));
app.use('/api/meetups', require('./routes/meetup'));
app.use('/api/visa', require('./routes/visa'));
app.use('/api/chats', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/community', require('./routes/community'));

// Socket.io connection for real-time chat
require('./utils/socket')(io);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AussieMate API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Define port
const PORT = process.env.PORT || 5000;
// 모든 네트워크 인터페이스에서 접속 허용 (0.0.0.0)
const HOST = '0.0.0.0';

// Connect to database and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공!');
    
    // 테이블이 존재하지 않으면 생성 (development 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('모델을 데이터베이스에 동기화했습니다.');
      
      // 시드 데이터 실행
      try {
        await runSeeds();
      } catch (seedError) {
        console.error('시드 데이터 실행 중 오류:', seedError);
      }
    }
    
    server.listen(PORT, HOST, () => {
      console.log(`서버가 ${HOST}:${PORT}에서 실행 중입니다.`);
      console.log(`로컬 접속: http://localhost:${PORT}`);
      console.log(`API 접속: http://${HOST}:${PORT}/api`);
      console.log('네트워크에서 접근하려면 아래 IP 주소 중 하나를 사용하세요:');
      
      // 컴퓨터의 네트워크 인터페이스 IP 주소들 출력
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          // IPv4 주소만 표시하고 내부 루프백 주소는 제외
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  - ${name}: http://${net.address}:${PORT}`);
          }
        }
      }
    });
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
  }
})();
