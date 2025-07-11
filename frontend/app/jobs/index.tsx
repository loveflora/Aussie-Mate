import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Modal
} from 'react-native';
import { Stack, router } from 'expo-router';
import { jobApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

type JobPost = {
  id: string;
  title: string;
  companyName: string;
  jobType: string;
  location: string;
  state: string;
  salary: string;
  visaRequirements: string;
  createdAt: string;
  images: string[];
};

export default function JobsScreen() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    jobType: '',
    visaRequirements: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const checkLoginStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setIsLoggedIn(false);
    }
  };

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 사이드바 상태
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  // 사이드바 열기/닫기 애니메이션
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarVisible ? 0 : 300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarVisible, slideAnim]);

  const openSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setIsLoggedIn(false);
      Alert.alert('로그아웃', '로그아웃 되었습니다.');
      closeSidebar();
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 처리 중 문제가 발생했습니다.');
    }
  };

  const handleLogin = () => {
    router.push('/login');
    closeSidebar();
  };

  const handleSignup = () => {
    router.push('/signup');
    closeSidebar();
  };
  
  const fetchJobs = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setLoading(true);
      }
      
      const currentPage = reset ? 1 : page;
      
      let response;
      if (searchQuery.trim()) {
        response = await jobApi.searchJobs(searchQuery, filters, currentPage, 10);
      } else {
        console.log('모든 작업 가져오기 시도:', currentPage);
        response = await jobApi.getAllJobs(filters, currentPage, 10);
      }
      
      // 안전하게 데이터 꺼내기 (빈 배열 기본값 지정)
      const newJobs = response?.data?.data ?? [];

      
      if (reset) {
        setJobs(newJobs);
      } else {
        setJobs((prev) => [...prev, ...newJobs]);
      }
      
      setHasMore(newJobs.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchJobs(true);
  }, [filters]);
  
  const handleSearch = () => {
    fetchJobs(true);
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchJobs();
    }
  };
  
  const renderJobItem = ({ item }: { item: JobPost }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => router.push(`/jobs/${item.id}`)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.companyName}>{item.companyName}</Text>
      </View>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.jobDetailText}>{item.location}, {item.state}</Text>
        </View>
        
        <View style={styles.jobDetailRow}>
          <Ionicons name="briefcase-outline" size={16} color="#666" />
          <Text style={styles.jobDetailText}>{item.jobType}</Text>
        </View>
        
        {item.salary && (
          <View style={styles.jobDetailRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.jobDetailText}>{item.salary}</Text>
          </View>
        )}
        
        {item.visaRequirements && (
          <View style={styles.jobDetailRow}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.jobDetailText}>비자요건: {item.visaRequirements}</Text>
          </View>
        )}
      </View>
      
      {item.images && item.images.length > 0 && (
        <Image 
          source={{ uri: `http://localhost:5000/${item.images[0]}` }} 
          style={styles.jobImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.jobFooter}>
        <Text style={styles.jobDate}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </Text>
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false, // Stack 헤더를 숨겨 GlobalHeader만 표시
        }}
      />
      
      {/* 사이드바 */}
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>AussieMate</Text>
          <TouchableOpacity onPress={closeSidebar}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sidebarContent}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity style={styles.sidebarButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.sidebarButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.sidebarButton} onPress={handleLogin}>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.sidebarButtonText}>로그인</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarButtonSecondary} onPress={handleSignup}>
                <Ionicons name="person-add-outline" size={20} color="#0066cc" />
                <Text style={styles.sidebarButtonTextSecondary}>회원가입</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 메인 메뉴 섹션 */}
          <Text style={styles.sidebarSectionTitle}>메인 메뉴</Text>
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.replace('/');
              closeSidebar();
            }}
          >
            <Ionicons name="home-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>홈</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]}
            onPress={() => {
              router.replace('/jobs');
              closeSidebar();
            }}
          >
            <Ionicons name="briefcase-outline" size={20} color="#0066cc" />
            <Text style={[styles.sidebarMenuItemText, styles.sidebarMenuItemTextActive]}>구직 정보</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.replace('/housing');
              closeSidebar();
            }}
          >
            <Ionicons name="home-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>주거 정보</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.replace('/community');
              closeSidebar();
            }}
          >
            <Ionicons name="people-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>커뮤니티</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.replace('/profile');
              closeSidebar();
            }}
          >
            <Ionicons name="person-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>프로필</Text>
          </TouchableOpacity>

          {/* 카테고리 메뉴 섹션 */}
          <Text style={styles.sidebarSectionTitle}>카테고리 메뉴</Text>
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.push('/news');
              closeSidebar();
            }}
          >
            <Ionicons name="newspaper-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>최근 소식</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.push('/questions');
              closeSidebar();
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>질문 게시판</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.push('/info');
              closeSidebar();
            }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>유용한 정보</Text>
          </TouchableOpacity>
          
          {/* 설정 메뉴 섹션 */}
          <Text style={styles.sidebarSectionTitle}>설정</Text>
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.push('/settings');
              closeSidebar();
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>앱 설정</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sidebarMenuItem}
            onPress={() => {
              router.push('/help');
              closeSidebar();
            }}
          >
            <Ionicons name="help-outline" size={20} color="#333" />
            <Text style={styles.sidebarMenuItemText}>도움말</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* 사이드바가 열릴 때 배경을 어둡게 */}
      {sidebarVisible && (
        <TouchableOpacity 
          style={styles.sidebarOverlay} 
          activeOpacity={1} 
          onPress={closeSidebar}
        />
      )}
      
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
      
      
      <View style={styles.filtersContainer}>
        <ScrollableFilter
          options={['전체', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']}
          selectedOption={filters.state || '전체'}
          onSelect={(option) => setFilters({...filters, state: option === '전체' ? '' : option})}
        />
        
        <ScrollableFilter
          options={['전체', '풀타임', '파트타임', '캐주얼', '계약직', '임시직', '인턴십']}
          selectedOption={filters.jobType || '전체'}
          onSelect={(option) => {
            const jobTypeMap: {[key: string]: string} = {
              '풀타임': 'full-time',
              '파트타임': 'part-time',
              '캐주얼': 'casual',
              '계약직': 'contract',
              '임시직': 'temporary',
              '인턴십': 'internship'
            };
            setFilters({
              ...filters, 
              jobType: option === '전체' ? '' : jobTypeMap[option] || ''
            });
          }}
        />
      </View>
      
      {loading && jobs.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <>
          <FlatList
            data={jobs}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>일자리 정보가 없습니다.</Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={async () => {
              try {
                const token = await SecureStore.getItemAsync('token');
                if (token) {
                  router.push('/jobs/create');
                } else {
                  router.push({
                    pathname: '/login',
                    params: { returnTo: '/jobs/create' }
                  });
                }
              } catch (error) {
                console.error('인증 확인 오류:', error);
                router.push('/login');
              }
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// 스크롤 가능한 필터 컴포넌트
const ScrollableFilter = ({ 
  options, 
  selectedOption, 
  onSelect 
}: { 
  options: string[], 
  selectedOption: string, 
  onSelect: (option: string) => void 
}) => {
  return (
    <View style={{ marginRight: 10 }}>
      <FlatList
        horizontal
        data={options}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterOption,
              selectedOption === item && styles.filterOptionSelected
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.filterOptionText,
                selectedOption === item && styles.filterOptionTextSelected
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    backgroundColor: 'white',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    paddingTop: 30,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  sidebarContent: {
    padding: 20,
  },
  sidebarButton: {
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sidebarButtonSecondary: {
    backgroundColor: '#f1f1f1',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  sidebarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sidebarButtonTextSecondary: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sidebarSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  sidebarMenuItemActive: {
    backgroundColor: '#f0f7ff',
  },
  sidebarMenuItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  sidebarMenuItemTextActive: {
    color: '#0066cc',
    fontWeight: 'bold',
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
  authButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  loginButton: {
    backgroundColor: '#0066cc',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#0066cc',
  },
  filterOptionText: {
    color: '#333',
    fontSize: 12,
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
  },
  jobDetails: {
    marginBottom: 10,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  jobImage: {
    height: 150,
    borderRadius: 8,
    marginVertical: 10,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  jobDate: {
    fontSize: 12,
    color: '#999',
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
    bottom: 80,
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
