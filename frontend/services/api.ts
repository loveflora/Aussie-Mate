import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API base URL configuration based on platform
const getBaseUrl = (): string => {
  // Use environment variable if available
  if (process.env.EXPO_PUBLIC_API_URL) {
     return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.20.5:5001/api';
  }
  
  // 기본 포트
  let port = 5001; // 서버가 5001 포트에서 실행 중
  
  // 개발 환경에서만 실행됨
  if (__DEV__) {
    console.log('백엔드가 포트 5001을 사용 중입니다.');
  }
  
  // Platform-specific defaults
  if (Platform.OS === 'web') {
    // For web, use relative URL
    return '/api'; // 웹에서는 상대 경로 사용
  } else if (Platform.OS === 'android') {
    // For Android emulator, 10.0.2.2 points to the host's localhost
    return `http://10.0.2.2:${port}/api`; // /api 경로 다시 추가
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, localhost points to the device itself
    return `http://192.168.20.5:${port}/api`; // /api 경로 다시 추가
  } else {
  // Default fallback - can be configured based on your network
  return `http://192.168.20.5:${port}/api`; // /api 경로 다시 추가
}
};

console.log('사용 중인 API URL:', getBaseUrl());

// axios 인스턴스 생성
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 타임아웃 30초로 늘림
});

// 디버깅용 완전한 URL 로깅
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    
    // 완전한 URL 출력 (디버깅용)
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API 요청 인터셉터:', config.url);
    console.log('완전한 요청 URL:', fullUrl);
    console.log('인증 토큰 있음:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 인증 토큰이 없으면 헤더에서 Authorization 제거
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    console.log('API 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log('API 응답 성공:', response.config.url);
    return response;
  },
  (error) => {
    console.log('API 응답 에러:', error.config?.url, error.code, error.message);
    
    // axios 에러인 경우 자세한 정보 로깅
    if (error.isAxiosError) {
      console.log('상세 에러 정보:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    
    // 401 에러 처리 (인증 만료)
    if (error.response && error.response.status === 401) {
      // 로그아웃 로직 추가 가능
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData: any) => api.put('/auth/me', userData),
};

// 일자리 게시글 관련 API
export const jobApi = {
  getAllJobs: (filters = {}, page = 1, limit = 10) => api.get('/jobs', { params: { ...filters, page, limit } }),
  getJobById: (id: string) => api.get(`/jobs/${id}`),
  createJob: (jobData: any) => api.post('/jobs', jobData),
  updateJob: (id: string, jobData: any) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
  searchJobs: (query: string, filters = {}, page = 1, limit = 10) => 
    api.get('/jobs/search', { params: { query, ...filters, page, limit } }),
  getMyJobs: () => api.get('/jobs/user/me'),
};

// 주거 게시글 관련 API
export const housingApi = {
  getAllHousing: (filters = {}, page = 1, limit = 10) => api.get('/housing', { params: { ...filters, page, limit } }),
  getHousingById: (id: string) => api.get(`/housing/${id}`),
  createHousing: (housingData: any) => api.post('/housing', housingData),
  updateHousing: (id: string, housingData: any) => api.put(`/housing/${id}`, housingData),
  deleteHousing: (id: string) => api.delete(`/housing/${id}`),
  searchHousing: (query: string, filters = {}, page = 1, limit = 10) => 
    api.get('/housing/search', { params: { query, ...filters, page, limit } }),
  getMyHousing: () => api.get('/housing/user/me'),
};

// 타입 정의
export type CommentData = {
  content: string;
};

export type SearchFilters = {
  category?: string;
};

// 커뮤니티 게시글 관련 API
export const communityApi = {
  /**
   * 모든 커뮤니티 게시물 조회
   */
  getAllPosts: (page = 1, limit = 10) => 
    api.get('/community/posts', { params: { page, limit } }),
  
  /**
   * 카테고리별 커뮤니티 게시물 조회
   */
  getPostsByCategory: (category: string, page = 1, limit = 10) => 
    api.get(`/community/posts/category/${category}`, { params: { page, limit } }),
  
  /**
   * 커뮤니티 게시물 검색
   */
  searchPosts: (query: string, filters: SearchFilters = {}, page = 1, limit = 10) => 
    api.get('/community/search', { 
      params: { 
        q: query, 
        category: filters.category, 
        page, 
        limit 
      } 
    }),
  
  /**
   * 특정 게시물 상세 조회
   */
  getPostById: (id: string) => api.get(`/community/posts/${id}`),
  
  /**
   * 특정 게시물의 댓글 조회
   */
  getCommentsByPostId: (postId: string) => 
    api.get(`/community/posts/${postId}/comments`),
  
  /**
   * 게시물에 좋아요 토글
   */
  likePost: (postId: string) => api.post(`/community/posts/${postId}/like`),
  
  /**
   * 새 댓글 작성
   */
  createComment: (postId: string, data: CommentData) => 
    api.post(`/community/posts/${postId}/comments`, data),
  
  /**
   * 새 게시물 작성 (이미지 포함)
   */
  createPost: (formData: FormData) => 
    api.post('/community/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  /**
   * 게시물 수정 (이미지 포함)
   */
  updatePost: (id: string, formData: FormData) => 
    api.put(`/community/posts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  /**
   * 게시물 삭제
   */
  deletePost: (id: string) => api.delete(`/community/posts/${id}`),
  
  /**
   * 댓글 삭제
   */
  deleteComment: (postId: string, commentId: string) => 
    api.delete(`/community/posts/${postId}/comments/${commentId}`),
    
  /**
   * 내 게시물 조회
   */
  getMyPosts: () => api.get('/community/user/me'),
};

// 비자 우편번호 관련 API
export const visaPostcodeApi = {
  getPostcodes: (filters = {}) => api.get('/visa/postcodes', { params: filters }),
};

export default api;
