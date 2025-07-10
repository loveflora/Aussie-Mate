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
import { jobApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

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
        response = await jobApi.getAllJobs(filters, currentPage, 10);
      }
      
      const newJobs = response.data.data;
      
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: '구직 정보',
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
            onPress={() => router.push('/jobs/create')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
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
