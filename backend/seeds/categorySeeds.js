const { Category } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * 카테고리 시드 데이터 생성
 * AussieMate 앱의 커뮤니티 게시판 카테고리 초기화
 */
const seedCategories = async () => {
  try {
    // 이미 카테고리가 있는지 확인
    const categoryCount = await Category.count();
    if (categoryCount > 0) {
      console.log('카테고리가 이미 존재합니다. 시드 작업을 건너뜁니다.');
      return;
    }

    // 카테고리 데이터 생성
    const categories = [
      {
        id: uuidv4(),
        name: '일반',
        slug: 'general',
        description: '일반적인 주제에 대한 이야기를 나누는 공간입니다.',
        icon: 'chat-bubble',
        color: '#4285F4',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '질문',
        slug: 'question',
        description: '호주 생활에 관한 질문과 답변을 나누는 공간입니다.',
        icon: 'help-circle',
        color: '#34A853',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '직업/구인',
        slug: 'job',
        description: '일자리 정보와 구직, 취업에 관한 이야기를 나누는 공간입니다.',
        icon: 'briefcase',
        color: '#FBBC05',
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '주거/숙소',
        slug: 'housing',
        description: '집, 아파트, 하우스 셰어 등 주거 관련 정보를 나누는 공간입니다.',
        icon: 'home',
        color: '#EA4335',
        order: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '비자',
        slug: 'visa',
        description: '호주 비자 정보와 이민 관련 이야기를 나누는 공간입니다.',
        icon: 'card',
        color: '#9C27B0',
        order: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '여행',
        slug: 'travel',
        description: '호주 여행 정보와 경험을 공유하는 공간입니다.',
        icon: 'airplane',
        color: '#03A9F4',
        order: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '팁/노하우',
        slug: 'tips',
        description: '호주 생활에 유용한 정보와 노하우를 공유하는 공간입니다.',
        icon: 'bulb',
        color: '#FF9800',
        order: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '장터',
        slug: 'marketplace',
        description: '중고 물품 거래와 나눔을 위한 공간입니다.',
        icon: 'cart',
        color: '#607D8B',
        order: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 카테고리 생성
    await Category.bulkCreate(categories);
    console.log('카테고리 시드 데이터가 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('카테고리 시드 생성 중 오류 발생:', error);
  }
};

module.exports = seedCategories;
