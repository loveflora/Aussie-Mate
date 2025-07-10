import axios from 'axios';
import { API_BASE_URL } from '@/constants';

// 타입 정의
export type CommentData = {
  content: string;
};

export type SearchFilters = {
  category?: string;
};

// 커뮤니티 API 서비스
const communityApi = {
  /**
   * 모든 커뮤니티 게시물 조회
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  getAllPosts: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts`, {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 카테고리별 커뮤니티 게시물 조회
   * @param category 카테고리 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  getPostsByCategory: async (category: string, page: number = 1, limit: number = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts/category/${category}`, {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 커뮤니티 게시물 검색
   * @param query 검색어
   * @param filters 필터 (카테고리 등)
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  searchPosts: async (
    query: string, 
    filters: SearchFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/search`, {
        params: {
          q: query,
          category: filters.category,
          page,
          limit
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 특정 게시물 상세 조회
   * @param id 게시물 ID
   */
  getPostById: async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 특정 게시물의 댓글 조회
   * @param postId 게시물 ID
   */
  getCommentsByPostId: async (postId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/community/posts/${postId}/comments`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 게시물에 좋아요 토글
   * @param postId 게시물 ID
   */
  likePost: async (postId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/like`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 새 댓글 작성
   * @param postId 게시물 ID
   * @param data 댓글 데이터
   */
  createComment: async (postId: string, data: CommentData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/community/posts/${postId}/comments`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 새 게시물 작성
   * @param formData 게시물 데이터와 이미지
   */
  createPost: async (formData: FormData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/community/posts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 게시물 수정
   * @param id 게시물 ID
   * @param formData 수정할 데이터와 이미지
   */
  updatePost: async (id: string, formData: FormData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/community/posts/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 게시물 삭제
   * @param id 게시물 ID
   */
  deletePost: async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/community/posts/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * 댓글 삭제
   * @param postId 게시물 ID
   * @param commentId 댓글 ID
   */
  deleteComment: async (postId: string, commentId: string) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default communityApi;
