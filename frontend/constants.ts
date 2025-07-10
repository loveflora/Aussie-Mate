/**
 * AussieMate 앱의 전역 상수 정의
 */

// API 관련
export const API_BASE_URL = 'http://localhost:5000';

// 커뮤니티 게시물 관련
export const COMMUNITY_CATEGORIES = [
  { id: 'general', label: '일반' },
  { id: 'question', label: '질문' },
  { id: 'job', label: '일자리' },
  { id: 'housing', label: '주거' },
  { id: 'visa', label: '비자' },
  { id: 'travel', label: '여행' },
  { id: 'tips', label: '팁' }
];

// 이미지 업로드 관련
export const MAX_UPLOAD_IMAGES = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// 페이지네이션 관련
export const DEFAULT_PAGE_SIZE = 10;

// 시간 포맷
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

// 앱 테마 색상
export const COLORS = {
  primary: '#4B89DC',
  secondary: '#FE9A2E',
  success: '#50C14E',
  danger: '#E74C3C',
  warning: '#F5D76E',
  info: '#3498DB',
  light: '#F5F5F5',
  dark: '#333333',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#DDDDDD',
};
