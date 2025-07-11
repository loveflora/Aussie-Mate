import { StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { View, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../constants/ApiUrl';

// Define types for API responses
interface JobPost {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'hiring' | 'seeking';
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
}

interface HousingPost {
  id: number;
  title: string;
  price: number;
  type: 'rent' | 'share' | 'wanted';
  suburb: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
  category: {
    id: number;
    name: string;
  };
  likes: number;
  comments: number;
}

export default function HomeScreen() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [housing, setHousing] = useState<HousingPost[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState({
    jobs: true,
    housing: true,
    community: true
  });
  const [refreshing, setRefreshing] = useState(false);

  // Function to format date
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
      return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
    }
  };

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading({
      jobs: true,
      housing: true,
      community: true
    });

    try {
      // Fetch jobs
      const jobsResponse = await axios.get(`${API_URL}/jobs?limit=10`);
      setJobs(jobsResponse.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }

    try {
      // Fetch housing
      const housingResponse = await axios.get(`${API_URL}/housing?limit=10`);
      setHousing(housingResponse.data);
    } catch (error) {
      console.error('Error fetching housing:', error);
    } finally {
      setLoading(prev => ({ ...prev, housing: false }));
    }

    try {
      // Fetch community posts
      const communityResponse = await axios.get(`${API_URL}/community/posts?limit=10`);
      setCommunityPosts(communityResponse.data.posts);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setLoading(prev => ({ ...prev, community: false }));
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchData();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Render job item
  const renderJobItem = ({ item }: { item: JobPost }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push(`/jobs/${item.id}`)}
    >
      <View style={styles.postCardHeader}>
        <View style={styles.postTypeTag}>
          <Text style={styles.postTypeText}>
            {item.type === 'hiring' ? '구인' : '구직'}
          </Text>
        </View>
        <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.postLocation} numberOfLines={1}>
        {item.location || (item.company ? `${item.company}` : '위치 정보 없음')}
      </Text>
      <View style={styles.postAuthor}>
        <Ionicons name="person-circle-outline" size={16} color="#666" />
        <Text style={styles.authorName}>{item.user?.nickname || '사용자'}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render housing item
  const renderHousingItem = ({ item }: { item: HousingPost }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push(`/housing/${item.id}`)}
    >
      <View style={styles.postCardHeader}>
        <View style={styles.postTypeTag}>
          <Text style={styles.postTypeText}>
            {item.type === 'rent' ? '렌트' : item.type === 'share' ? '쉐어' : '구함'}
          </Text>
        </View>
        <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
      <View style={styles.housingPriceContainer}>
        <Text style={styles.housingPrice}>${item.price}/주</Text>
        <Text style={styles.postLocation}>{item.suburb || '지역 정보 없음'}</Text>
      </View>
      <View style={styles.postAuthor}>
        <Ionicons name="person-circle-outline" size={16} color="#666" />
        <Text style={styles.authorName}>{item.user?.name || '사용자'}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render community post item
  const renderCommunityItem = ({ item }: { item: CommunityPost }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push(`/community/${item.id}`)}
    >
      <View style={styles.postCardHeader}>
        <View style={styles.postTypeTag}>
          <Text style={styles.postTypeText}>
            {item.category?.name || '자유게시판'}
          </Text>
        </View>
        <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      <View style={styles.postInteractionBar}>
        <View style={styles.postAuthor}>
          <Ionicons name="person-circle-outline" size={16} color="#666" />
          <Text style={styles.authorName}>{item.user?.nickname || '사용자'}</Text>
        </View>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.likes || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.comments || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render category section
  const renderCategorySection = (
    title: string, 
    icon: string, 
    items: any[], 
    renderItem: any, 
    isLoading: boolean,
    routePath: string
  ) => (
    <View style={styles.categorySection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={22} color="#0066cc" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(routePath)}>
          <Text style={styles.viewMoreText}>더 보기</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
        </View>
      ) : items.length > 0 ? (
        <FlatList
          data={items.slice(0, 5)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal={false}
          scrollEnabled={false}
          style={styles.postList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>등록된 글이 없습니다.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AussieMate</Text>
        <Text style={styles.welcomeText}>호주에서의 생활을 더 쉽게</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderCategorySection(
          '구인/구직', 
          'briefcase-outline',
          jobs, 
          renderJobItem, 
          loading.jobs,
          '/jobs'
        )}
        
        {renderCategorySection(
          '쉐어하우스/렌트', 
          'home-outline',
          housing, 
          renderHousingItem, 
          loading.housing,
          '/housing'
        )}
        
        {renderCategorySection(
          '자유게시판', 
          'chatbubbles-outline',
          communityPosts, 
          renderCommunityItem, 
          loading.community,
          '/community'
        )}
        
        <View style={styles.menuButtonsContainer}>
          <TouchableOpacity 
            style={styles.quickMenuButton}
            onPress={() => router.push('/visa')}
          >
            <Ionicons name="map-outline" size={24} color="#0066cc" />
            <Text style={styles.quickMenuText}>비자 지방지역 찾기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickMenuButton}
            onPress={() => router.push('/community')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#0066cc" />
            <Text style={styles.quickMenuText}>정보게시판</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  categorySection: {
    marginVertical: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewMoreText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  postList: {
    width: '100%',
  },
  postCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  postTypeTag: {
    backgroundColor: '#eef7ff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  postTypeText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '500',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  postLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  housingPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  housingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  postInteractionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  loaderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  menuButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  quickMenuButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickMenuText: {
    marginTop: 8,
    color: '#333',
    fontWeight: '500',
  }
});
