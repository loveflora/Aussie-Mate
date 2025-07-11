import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { jobApi } from '@/services/api';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';

// 작업 게시물 생성 페이지 컴포넌트
export default function CreateJobScreen() {
  // 로그인 상태 확인 및 리다이렉션
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          // 로그인 페이지로 이동, 로그인 후 돌아올 경로 전달
          router.replace({
            pathname: '/login',
            params: { returnTo: '/jobs/create' }
          });
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        // 오류 발생 시에도 로그인 페이지로 이동
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, []);

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    jobType: '풀타임', // 기본값
    location: '',
    state: '시드니', // 기본값
    salary: '',
    visaRequirements: '',
    description: '',
  });
  
  // 로딩 상태 관리
  const [loading, setLoading] = useState(false);
  
  // 입력값 변경 핸들러
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async () => {
    // 필수 입력 필드 검증
    if (!formData.title || !formData.companyName || !formData.location) {
      Alert.alert('입력 오류', '제목, 회사명, 위치는 필수 입력 항목입니다.');
      return;
    }
    
    // 로딩 상태 활성화
    setLoading(true);
    
    try {
      // API 호출
      await jobApi.createJob(formData);
      
      // 성공 메시지
      Alert.alert(
        '게시 완료', 
        '작업 게시물이 성공적으로 등록되었습니다.', 
        [{ text: '확인', onPress: () => router.push('/jobs') }]
      );
    } catch (error) {
      console.error('작업 게시물 생성 오류:', error);
      Alert.alert('오류 발생', '작업 게시물 등록 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 취소 핸들러
  const handleCancel = () => {
    router.back();
  };
  
  // 주 선택 옵션
  const stateOptions = [
    '시드니', '멜버른', '브리즈번', '퍼스', '애들레이드', 
    '호바트', '다윈', '캔버라', '골드코스트', '기타'
  ];
  
  // 고용 유형 옵션
  const jobTypeOptions = [
    '풀타임', '파트타임', '캐주얼', '계약직', '프리랜서', '인턴십', '기타'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: '작업 게시물 작성',
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* 제목 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput 
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              placeholder="작업 제목을 입력하세요"
            />
          </View>

          {/* 회사명 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>회사명 *</Text>
            <TextInput 
              style={styles.input}
              value={formData.companyName}
              onChangeText={(value) => handleChange('companyName', value)}
              placeholder="회사명을 입력하세요"
            />
          </View>

          {/* 고용 유형 선택 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>고용 유형</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.jobType}
                onValueChange={(value) => handleChange('jobType', value)}
                style={styles.picker}
              >
                {jobTypeOptions.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>

          {/* 위치 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>위치 *</Text>
            <TextInput 
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleChange('location', value)}
              placeholder="위치를 입력하세요 (예: 시티, 차츠우드)"
            />
          </View>

          {/* 주 선택 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>주 (State)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.state}
                onValueChange={(value) => handleChange('state', value)}
                style={styles.picker}
              >
                {stateOptions.map((state) => (
                  <Picker.Item key={state} label={state} value={state} />
                ))}
              </Picker>
            </View>
          </View>

          {/* 급여 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>급여 (선택사항)</Text>
            <TextInput 
              style={styles.input}
              value={formData.salary}
              onChangeText={(value) => handleChange('salary', value)}
              placeholder="급여 정보를 입력하세요 (예: $25/hr, $70,000/년)"
              keyboardType="default"
            />
          </View>

          {/* 비자 요건 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비자 요건 (선택사항)</Text>
            <TextInput 
              style={styles.input}
              value={formData.visaRequirements}
              onChangeText={(value) => handleChange('visaRequirements', value)}
              placeholder="필요한 비자 조건을 입력하세요 (예: 워킹홀리데이, PR)"
            />
          </View>

          {/* 상세 설명 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>상세 설명</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="작업에 대한 상세 설명을 입력하세요"
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>게시하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
