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
import { Stack, router } from 'expo-router';
import { housingApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

type HousingPost = {
  id: string;
  title: string;
  price: number;
  housingType: string;
  location: string;
  state: string;
  numBedrooms: number;
  numBathrooms: number;
  genderPreference: string;
  petsAllowed: boolean;
  images: string[];
  createdAt: string;
};

export default function HousingScreen() {
  const [housings, setHousings] = useState<HousingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    housingType: '',
    minPrice: '',
    maxPrice: '',
    numBedrooms: '',
    genderPreference: '',
    petsAllowed: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchHousingPosts = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setLoading(true);
      }
      
      const currentPage = reset ? 1 : page;
      
      let response;
      if (searchQuery.trim()) {
        response = await housingApi.searchHousing(searchQuery, filters, currentPage, 10);
      } else {
        response = await housingApi.getAllHousing(filters, currentPage, 10);
      }
      
      const newHousings = response.data.data ?? [];
      
      if (reset) {
        setHousings(newHousings);
      } else {
        setHousings((prev) => [...prev, ...newHousings]);
      }
      
      setHasMore(newHousings.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching housing:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHousingPosts(true);
  }, [filters]);
  
  const handleSearch = () => {
    fetchHousingPosts(true);
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchHousingPosts();
    }
  };
  
  // 주거 유형 한글 매핑
  const getHousingTypeKorean = (type: string) => {
    const typeMap: {[key: string]: string} = {
      'apartment': '아파트',
      'house': '주택',
      'townhouse': '타운하우스',
      'studio': '스튜디오',
      'shared': '쉐어하우스',
      'room': '방'
    };
    return typeMap[type] || type;
  };
  
  // 성별 선호도 한글 매핑
  const getGenderPreferenceKorean = (preference: string) => {
    const preferenceMap: {[key: string]: string} = {
      'any': '무관',
      'male': '남성 선호',
      'female': '여성 선호',
      'couple': '커플 가능'
    };
    return preferenceMap[preference] || preference;
  };
  
  const renderHousingItem = ({ item }: { item: HousingPost }) => (
    <TouchableOpacity 
      style={styles.housingCard}
      onPress={() => router.push(`/housing/${item.id}`)}
    >
      {item.images && item.images.length > 0 ? (
        <Image 
          source={{ uri: `http://localhost:5000/${item.images[0]}` }} 
          style={styles.housingImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Ionicons name="home-outline" size={40} color="#ddd" />
        </View>
      )}
      
      <View style={styles.housingInfo}>
        <Text style={styles.housingPrice}>
          ${item.price.toLocaleString()}
          {item.housingType === 'shared' || item.housingType === 'room' ? '/주' : '/월'}
        </Text>
        <Text style={styles.housingTitle}>{item.title}</Text>
        
        <View style={styles.housingDetails}>
          <View style={styles.housingDetailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.housingDetailText}>{item.location}, {item.state}</Text>
          </View>
          
          <View style={styles.housingDetailRow}>
            <Ionicons name="home-outline" size={16} color="#666" />
            <Text style={styles.housingDetailText}>{getHousingTypeKorean(item.housingType)}</Text>
          </View>
          
          <View style={styles.housingFeatures}>
            {item.numBedrooms > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="bed-outline" size={14} color="#666" />
                <Text style={styles.featureText}>{item.numBedrooms}</Text>
              </View>
            )}
            
            {item.numBathrooms > 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="water-outline" size={14} color="#666" />
                <Text style={styles.featureText}>{item.numBathrooms}</Text>
              </View>
            )}
            
            {item.genderPreference && (
              <View style={styles.featureItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.featureText}>
                  {getGenderPreferenceKorean(item.genderPreference)}
                </Text>
              </View>
            )}
            
            {item.petsAllowed && (
              <View style={styles.featureItem}>
                <Ionicons name="paw-outline" size={14} color="#666" />
                <Text style={styles.featureText}>반려동물 가능</Text>
              </View>
            )}
          </View>
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
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
          options={['전체', '아파트', '주택', '타운하우스', '스튜디오', '쉐어하우스', '방']}
          selectedOption={filters.housingType ? 
            getHousingTypeKorean(filters.housingType) : '전체'}
          onSelect={(option) => {
            const housingTypeMap: {[key: string]: string} = {
              '아파트': 'apartment',
              '주택': 'house',
              '타운하우스': 'townhouse',
              '스튜디오': 'studio',
              '쉐어하우스': 'shared',
              '방': 'room'
            };
            setFilters({
              ...filters, 
              housingType: option === '전체' ? '' : housingTypeMap[option] || ''
            });
          }}
        />
        
        <ScrollableFilter
          options={['전체', '무관', '남성 선호', '여성 선호', '커플 가능']}
          selectedOption={filters.genderPreference ? 
            getGenderPreferenceKorean(filters.genderPreference) : '전체'}
          onSelect={(option) => {
            const genderPrefMap: {[key: string]: string} = {
              '무관': 'any',
              '남성 선호': 'male',
              '여성 선호': 'female',
              '커플 가능': 'couple'
            };
            setFilters({
              ...filters, 
              genderPreference: option === '전체' ? '' : genderPrefMap[option] || ''
            });
          }}
        />
      </View>
      
      {loading && housings.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <>
          <FlatList
            data={housings}
            renderItem={renderHousingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>주거 정보가 없습니다.</Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => router.push('/housing/create')}
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
  housingCard: {
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
  housingImage: {
    width: '100%',
    height: 150,
  },
  noImageContainer: {
    height: 150,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  housingInfo: {
    padding: 16,
  },
  housingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  housingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  housingDetails: {
    marginTop: 4,
  },
  housingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  housingDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  housingFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
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
