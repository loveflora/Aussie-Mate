import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { communityApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

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
  commentsCount: number;
  likesCount: number;
  isLiked?: boolean;
};

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = [
    { id: '', name: '전체' },
    { id: 'general', name: '일반' },
    { id: 'question', name: '질문' },
    { id: 'information', name: '정보' },
    { id: 'event', name: '이벤트' },
    { id: 'meetup', name: '모임' },
  ];
  
  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setLoading(true);
      }
      
      const currentPage = reset ? 1 : page;
      
      let response;
      if (searchQuery.trim()) {
        response = await communityApi.searchPosts(searchQuery, { category: activeCategory }, currentPage, 10);
      } else if (activeCategory) {
        response = await communityApi.getPostsByCategory(activeCategory, currentPage, 10);
      } else {
        response = await communityApi.getAllPosts(currentPage, 10);
      }
      
      const newPosts = response.data.data;
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPosts(true);
  }, [activeCategory]);
  
  const handleSearch = () => {
    fetchPosts(true);
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts();
    }
  };
  
  const handleLikePost = async (postId: string) => {
    try {
      await communityApi.likePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
              isLiked: !post.isLiked 
            } 
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  // 카테고리 한글 변환
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '일반';
  };
  
  // 날짜 형식 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };
  
  const renderPostItem = ({ item }: { item: CommunityPost }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push(`/community/${item.id}`)}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.user?.profile ? (
              <Image 
                source={{ uri: `http://localhost:5000/${item.user.profile}` }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons name="person" size={18} color="#fff" />
            )}
          </View>
          <Text style={styles.userName}>{item.user?.name || '사용자'}</Text>
          <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{getCategoryName(item.category)}</Text>
        </View>
      </View>
      
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postExcerpt} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      
      {item.images && item.images.length > 0 && (
        <Image 
          source={{ uri: `http://localhost:5000/${item.images[0]}` }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => handleLikePost(item.id)}
        >
          <Ionicons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={item.isLiked ? "#e74c3c" : "#666"} 
          />
          <Text style={styles.footerButtonText}>{item.likesCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={styles.footerButtonText}>{item.commentsCount}</Text>
        </TouchableOpacity>
        
        <View style={styles.footerButton}>
          <Ionicons name="eye-outline" size={18} color="#666" />
          <Text style={styles.footerButtonText}>{item.views}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderListFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#0066cc" />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: '커뮤니티',
          headerShown: true,
        }}
      />
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="검색어를 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                activeCategory === item.id && styles.activeCategoryButton
              ]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  activeCategory === item.id && styles.activeCategoryButtonText
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      {loading && posts.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <>
          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>게시물이 없습니다.</Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => router.push('/community/create')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesList: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#0066cc',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  postTime: {
    color: '#999',
    fontSize: 12,
    marginLeft: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    padding: 12,
    paddingTop: 0,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  postExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
