import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  ActivityIndicator, 
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { jobApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

type JobDetail = {
  id: string;
  title: string;
  companyName: string;
  jobType: string;
  location: string;
  state: string;
  salary: string;
  description: string;
  visaRequirements: string;
  contactEmail: string;
  contactPhone: string;
  images: string[];
  createdAt: string;
  views: number;
  status: string;
  userId: string;
  user: {
    name: string;
    profile: string;
  };
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  
  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        if (!id) return;
        const response = await jobApi.getJobById(id);
        setJob(response.data.data);
      } catch (error) {
        console.error('Error fetching job details:', error);
        Alert.alert('오류', '일자리 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetail();
  }, [id]);
  
  const handleShare = async () => {
    if (!job) return;
    
    try {
      await Share.share({
        message: `AussieMate에서 일자리를 확인해보세요: ${job.title} - ${job.companyName}\n${job.location}, ${job.state}`,
        title: job.title,
      });
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };
  
  const handleContact = (type: 'email' | 'phone') => {
    if (!job) return;
    
    if (type === 'email' && job.contactEmail) {
      Linking.openURL(`mailto:${job.contactEmail}?subject=AussieMate 일자리 문의: ${job.title}`);
    } else if (type === 'phone' && job.contactPhone) {
      Linking.openURL(`tel:${job.contactPhone}`);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerTitle: '일자리 정보',
            headerShown: true,
          }}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerTitle: '일자리 정보',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>일자리 정보를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>이전으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: '일자리 정보',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#0066cc" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* 이미지 슬라이더 */}
        <View style={styles.imageContainer}>
          {job.images && job.images.length > 0 ? (
            <>
              <Image 
                source={{ uri: `http://localhost:5000/${job.images[imageIndex]}` }} 
                style={styles.mainImage}
                resizeMode="cover"
              />
              {job.images.length > 1 && (
                <View style={styles.thumbnailContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {job.images.map((img, index) => (
                      <TouchableOpacity 
                        key={index}
                        onPress={() => setImageIndex(index)}
                      >
                        <Image 
                          source={{ uri: `http://localhost:5000/${img}` }} 
                          style={[
                            styles.thumbnail, 
                            imageIndex === index && styles.activeThumbnail
                          ]}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="briefcase-outline" size={60} color="#ddd" />
              <Text style={styles.noImageText}>이미지가 없습니다</Text>
            </View>
          )}
        </View>
        
        {/* 헤더 정보 */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.companyName}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{job.views}회 조회</Text>
            </View>
            <Text style={styles.statDivider}>•</Text>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                {new Date(job.createdAt).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 주요 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>위치</Text>
              <Text style={styles.infoValue}>{job.location}, {job.state}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="briefcase-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>고용 형태</Text>
              <Text style={styles.infoValue}>{job.jobType}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            {job.salary && (
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>급여</Text>
                <Text style={styles.infoValue}>{job.salary}</Text>
              </View>
            )}
            
            {job.visaRequirements && (
              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>비자 요건</Text>
                <Text style={styles.infoValue}>{job.visaRequirements}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* 상세 설명 */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>상세 설명</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>
        
        {/* 연락처 정보 */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>연락처</Text>
          <View style={styles.contactButtons}>
            {job.contactEmail && (
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContact('email')}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>이메일로 문의하기</Text>
              </TouchableOpacity>
            )}
            
            {job.contactPhone && (
              <TouchableOpacity 
                style={[styles.contactButton, styles.phoneButton]}
                onPress={() => handleContact('phone')}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>전화로 문의하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* 등록자 정보 */}
        <View style={styles.userSection}>
          <Text style={styles.sectionTitle}>등록자</Text>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {job.user?.profile ? (
                <Image 
                  source={{ uri: `http://localhost:5000/${job.user.profile}` }}
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person" size={24} color="#fff" />
              )}
            </View>
            <Text style={styles.userName}>{job.user?.name || '사용자'}</Text>
          </View>
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
  loaderContainer: {
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
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  noImageContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    color: '#999',
    marginTop: 10,
  },
  thumbnailContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeThumbnail: {
    borderColor: '#0066cc',
    borderWidth: 2,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  company: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  statDivider: {
    marginHorizontal: 10,
    color: '#ccc',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginVertical: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  contactSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  phoneButton: {
    backgroundColor: '#4CAF50',
    marginRight: 0,
    marginLeft: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  userSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
});
