const { sequelize } = require('../config/db');
const seedCategories = require('./categorySeeds');

/**
 * 모든 시드 데이터를 실행하는 함수
 */
const runSeeds = async () => {
  try {
    console.log('시드 데이터 생성을 시작합니다...');
    
    // 시퀄라이즈 연결 확인
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공!');
    
    // 카테고리 시드 실행
    await seedCategories();
    
    // 여기에 추가 시드 함수 실행 코드 추가
    // await seedOtherData();
    
    console.log('모든 시드 데이터 생성이 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  }
};

// 스크립트가 직접 실행될 경우에만 시드 함수 실행
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
