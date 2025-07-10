import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 개발 환경에서의 API URL 설정
// 환경에 따라 적절한 URL 사용
let API_URL = '';

// 플랫폼에 따라 적절한 URL 설정
if (Platform.OS === 'web') {
  // 웹에서는 상대 경로 사용 가능
  API_URL = '/api';
} else if (Platform.OS === 'android') {
  if (Constants.expoConfig?.extra?.apiUrl) {
    // app.config.js에 설정된 URL 사용
    API_URL = Constants.expoConfig?.extra?.apiUrl;
  } else {
    // Android 에뮬레이터 기본 설정
    API_URL = 'http://10.0.2.2:5000/api';
  }
} else if (Platform.OS === 'ios') {
  if (Constants.expoConfig?.extra?.apiUrl) {
    // app.config.js에 설정된 URL 사용
    API_URL = Constants.expoConfig?.extra?.apiUrl;
  } else {
    // iOS 시뮬레이터 기본 설정
    API_URL = 'http://localhost:5000/api';
  }
}

// 여기에서 실제 컴퓨터의 IP 주소로 직접 설정할 수 있습니다
// 아래 주석을 해제하고 실제 IP 주소로 변경하세요
// API_URL = 'http://YOUR_ACTUAL_IP:5000/api';  // YOUR_ACTUAL_IP를 실제 IP 주소로 변경하세요

console.log('사용 중인 API URL:', API_URL);

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 타임아웃 30초로 늘림
});

// 인터셉터로 모든 요청에 토큰 추가
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
