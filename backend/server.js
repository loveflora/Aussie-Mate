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
  origin: ['http://localhost:5000', 'http://localhost:5001', 'http://localhost:3000', 
           'http://192.168.20.5:5000', 'http://192.168.20.5:5001', 'http://192.168.20.5:3000', 
           'http://10.0.2.2:5000', 'http://10.0.2.2:5001', 'http://10.0.2.2:3000', 
           'exp://192.168.20.5:8081', 'exp://192.168.20.5:19000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 추가 헤더 설정
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5000', 'http://localhost:5001', 'http://localhost:3000', 
                          'http://192.168.20.5:5000', 'http://192.168.20.5:5001', 'http://192.168.20.5:3000', 
                          'http://10.0.2.2:5000', 'http://10.0.2.2:5001', 'http://10.0.2.2:3000', 
                          'exp://192.168.20.5:8081', 'exp://192.168.20.5:19000'];
  const origin = req.headers.origin;
  
  // 요청 정보 로깅
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('요청 헤더:', JSON.stringify({
    origin: req.headers.origin,
    referer: req.headers.referer,
    host: req.headers.host,
    authorization: req.headers.authorization ? '존재함' : '없음'
  }));
  
  // 허용된 출처인 경우 해당 출처 설정, 아니면 '*' 사용
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS 요청 처리');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// 디버깅을 위한 요청 로그
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   next();
// });

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
  console.log('기본 경로(/) 요청 받음');
  res.json({ message: 'Welcome to AussieMate API' });
});

// 테스트 API 엔드포인트 추가
app.get('/api/test', (req, res) => {
  console.log('GET /api/test 테스트 엔드포인트 호출됨');
  console.log('요청 헤더:', req.headers);
  
  return res.status(200).json({ 
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      authorization: req.headers.authorization ? '존재함' : '없음'
    }
  });
});

// 새로운 테스트 라우트 추가 (다른 경로에서도 테스트)
app.get('/test', (req, res) => {
  console.log('GET /test 엔드포인트 호출됨 (api 경로 없음)');
  return res.status(200).json({ message: 'Test successful without /api prefix' });
});

// 기본 작업 테스트 라우트
app.get('/api/jobs/test', (req, res) => {
  console.log('GET /api/jobs/test 엔드포인트 호출됨');
  return res.status(200).json({ 
    message: 'Job API test successful',
    jobs: [
      { id: 1, title: '테스트 작업 1', company: '테스트 회사' },
      { id: 2, title: '테스트 작업 2', company: '테스트 회사' }
    ]
  });
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
    console.log('DB 연결 설정:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      port: 3306
    });
    
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
    
    // 서버 시작
    try {
      const startServer = (port) => {
        return new Promise((resolve, reject) => {
          const serverInstance = server.listen(port, HOST)
            .once('listening', () => {
              console.log(`서버가 ${HOST}:${port}에서 실행 중입니다.`);
              console.log(`로컬 접속: http://localhost:${port}`);
              console.log(`API 접속: http://${HOST}:${port}/api`);
              console.log('네트워크에서 접근하려면 아래 IP 주소 중 하나를 사용하세요:');
              
              // 컴퓨터의 네트워크 인터페이스 IP 주소들 출력
              try {
                const { networkInterfaces } = require('os');
                const nets = networkInterfaces();
                
                for (const name of Object.keys(nets)) {
                  for (const net of nets[name]) {
                    // IPv4 주소만 표시, 내부 인터페이스 제외
                    if (net.family === 'IPv4' && !net.internal) {
                      console.log(`- 인터페이스 ${name}: http://${net.address}:${port}`);
                      console.log(`  API 접속: http://${net.address}:${port}/api`);
                    }
                  }
                }
              } catch (netError) {
                console.error('네트워크 인터페이스 정보 가져오기 실패:', netError);
              }
              
              resolve(serverInstance);
            })
            .once('error', (err) => {
              if (err.code === 'EADDRINUSE') {
                console.log(`포트 ${port}가 이미 사용 중입니다. 다른 포트를 시도합니다.`);
                reject(err);
              } else {
                console.error('서버 시작 중 오류:', err);
                reject(err);
              }
            });
        });
      };
      
      let serverRunning = false; // 서버 실행 여부 추적
      
      try {
        // 먼저 기본 포트 시도
        await startServer(PORT);
        serverRunning = true; // 서버가 성공적으로 시작됨
      } catch (err) {
        if (err.code === 'EADDRINUSE') {
          console.log(`기본 포트 ${PORT}가 사용 중입니다. 대체 포트를 시도합니다...`);
          
          const ALTERNATIVE_PORTS = [5001, 5002, 5003, 3000, 8080]; // 대체 포트 목록
          
          for (const altPort of ALTERNATIVE_PORTS) {
            if (serverRunning) break; // 서버가 이미 실행 중이면 중단
            
            try {
              await startServer(altPort);
              // 프론트엔드에서 참조할 수 있도록 실제 사용된 포트를 파일에 기록
              require('fs').writeFileSync('./.port', altPort.toString());
              serverRunning = true; // 서버가 성공적으로 시작됨
              break; // 성공하면 루프 종료
            } catch (portErr) {
              if (portErr.code === 'EADDRINUSE') {
                console.log(`포트 ${altPort}도 사용 중입니다. 다음 포트 시도...`);
              } else {
                console.error(`포트 ${altPort} 시작 중 오류:`, portErr);
              }
              continue;
            }
          }
          
          if (!serverRunning) {
            console.error('사용 가능한 포트를 찾을 수 없습니다. 서버를 시작할 수 없습니다.');
            process.exit(1);
          }
        } else {
          console.error('서버 시작 중 오류:', err);
          process.exit(1);
        }
      }
    } catch (serverError) {
      console.error('서버 시작 중 오류:', serverError);
    }
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    
    // 연결 실패시 5초 후 재시도
    console.log('5초 후 데이터베이스 연결을 다시 시도합니다...');
    setTimeout(() => {
      console.log('서버를 다시 시작합니다.');
      process.exit(1); // 프로세스 종료 (PM2 등으로 관리시 자동 재시작)
    }, 5000);
  }
})().catch(err => {
  console.error('최상위 레벨 오류 발생:', err);
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (err) => {
  console.error('처리되지 않은 예외:', err);
});

// 처리되지 않은 프로미스 거부 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 프로미스 거부:', reason);
});
