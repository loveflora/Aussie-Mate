import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { communityApi } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    name: string;
    profile: string;
  };
};

type CommunityPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string[];
  createdAt: string;
  views: number;
  userId: string;
  user: {
    name: string;
    profile: string;
  };
  likesCount: number;
  isLiked?: boolean;
  comments?: Comment[];
};

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const categories = {
    'general': '일반',
    'question': '질문',
    'information': '정보',
    'event': '이벤트',
    'meetup': '모임',
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const response = await communityApi.getPostById(id);
        setPost(response.data);
        
        if (response.data.comments) {
          setComments(response.data.comments);
        } else {
          // 댓글이 별도로 로드되어야 하는 경우
          const commentsResponse = await communityApi.getCommentsByPostId(id);
          setComments(commentsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostDetails();
  }, [id]);

  const handleShare = async () => {
    if (!post) return;
    
    try {
      await Share.share({
        message: `${post.title} - AussieMate 커뮤니티`,
        url: `https://aussiemate.com/community/${id}`, // 앱 스키마 또는 딥 링크로 변경 필요
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      await communityApi.likePost(id);
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
          isLiked: !prev.isLiked
        };
      });
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('오류', '좋아요 처리 중 문제가 발생했습니다.');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !id) return;
    
    try {
      setSubmittingComment(true);
      const response = await communityApi.createComment(id, { content: newComment });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      
      // 댓글 입력 후 키보드를 내리기 위해 포커스 해제
      if (Platform.OS === 'ios') {
        // iOS는 blur()를 직접 호출할 필요가 없음
      } else {
        // Android의 경우
        const currentFocus = TextInput.State.currentlyFocusedInput();
        currentFocus && currentFocus.blur();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('오류', '댓글 등록 중 문제가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 날짜 형식 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || '게시물을 찾을 수 없습니다.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerTitle: '커뮤니티',
            headerShown: true,
          }}
        />
        
        <ScrollView
          ref={scrollRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 게시물 헤더 */}
          <View style={styles.postHeader}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {categories[post.category as keyof typeof categories] || '일반'}
              </Text>
            </View>
            <Text style={styles.postTitle}>{post.title}</Text>
            
            <View style={styles.authorContainer}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  {post.user?.profile ? (
                    <Image 
                      source={{ uri: `http://localhost:5000/${post.user.profile}` }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Ionicons name="person" size={18} color="#fff" />
                  )}
                </View>
                <Text style={styles.userName}>{post.user?.name || '사용자'}</Text>
              </View>
              
              <View style={styles.postInfoRow}>
                <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                <View style={styles.postStats}>
                  <Ionicons name="eye-outline" size={16} color="#777" />
                  <Text style={styles.statText}>{post.views}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* 이미지 슬라이더 */}
          {post.images && post.images.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.floor(
                    Math.floor(e.nativeEvent.contentOffset.x) / 
                    Math.floor(SCREEN_WIDTH - 32)
                  );
                  setActiveImageIndex(newIndex);
                }}
              >
                {post.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: `http://localhost:5000/${image}` }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              
              {post.images.length > 1 && (
                <View style={styles.pagination}>
                  {post.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        activeImageIndex === index && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
          
          {/* 게시물 내용 */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{post.content}</Text>
          </View>
          
          {/* 액션 버튼 */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={post.isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={post.isLiked ? "#e74c3c" : "#666"} 
              />
              <Text style={styles.actionButtonText}>
                좋아요 {post.likesCount > 0 ? post.likesCount : ''}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#666" />
              <Text style={styles.actionButtonText}>공유</Text>
            </TouchableOpacity>
          </View>
          
          {/* 댓글 섹션 */}
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>댓글 {comments.length}</Text>
            
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUserInfo}>
                    <View style={styles.commentAvatarContainer}>
                      {comment.user?.profile ? (
                        <Image 
                          source={{ uri: `http://localhost:5000/${comment.user.profile}` }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <Ionicons name="person" size={16} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.commentUserName}>{comment.user?.name || '사용자'}</Text>
                  </View>
                  <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))}
            
            {comments.length === 0 && (
              <View style={styles.noCommentsContainer}>
                <Text style={styles.noCommentsText}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* 댓글 입력 영역 */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.commentSubmitButton, !newComment.trim() && styles.commentSubmitButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  authorContainer: {
    marginTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
  },
  postInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    color: '#999',
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    color: '#777',
    fontSize: 12,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  postImage: {
    width: SCREEN_WIDTH - 32,
    height: 250,
    borderRadius: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#0066cc',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  commentsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    padding: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  commentAvatar: {
    width: '100%',
    height: '100%',
  },
  commentUserName: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentDate: {
    color: '#999',
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  noCommentsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCommentsText: {
    color: '#999',
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
