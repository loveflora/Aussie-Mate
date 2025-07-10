import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { communityApi } from '@/services/api';

export default function CreateCommunityPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  
  const categories = [
    { id: 'general', name: '일반' },
    { id: 'question', name: '질문' },
    { id: 'information', name: '정보' },
    { id: 'event', name: '이벤트' },
    { id: 'meetup', name: '모임' },
  ];
  
  const getCategoryNameById = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    return category ? category.name : '일반';
  };
  
  const pickImage = async () => {
    // 이미지 권한 요청
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한이 필요합니다', '앱이 사진에 접근할 수 있도록 권한을 허용해주세요.');
        return;
      }
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    
    if (!result.canceled && result.assets) {
      // 최대 5개 이미지까지만 허용
      if (images.length + result.assets.length > 5) {
        Alert.alert('이미지 제한', '최대 5개까지의 이미지만 업로드 가능합니다.');
        // 5개까지만 추가
        const remainingSlots = 5 - images.length;
        if (remainingSlots > 0) {
          setImages(prev => [...prev, ...result.assets.slice(0, remainingSlots)]);
        }
      } else {
        setImages(prev => [...prev, ...result.assets]);
      }
    }
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert('입력 오류', '내용을 입력해주세요.');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // 이미지 업로드를 위한 FormData 생성
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      
      // 이미지 파일 추가
      images.forEach((image, index) => {
        const imageUri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
        const imageName = imageUri.split('/').pop() || `image_${index}.jpg`;
        
        formData.append('images', {
          uri: imageUri,
          type: 'image/jpeg',
          name: imageName,
        } as any);
      });
      
      // API 호출
      const response = await communityApi.createPost(formData);
      
      Alert.alert(
        '작성 완료', 
        '게시물이 등록되었습니다.',
        [{ 
          text: '확인', 
          onPress: () => router.replace(`/community/${response.data.id}`) 
        }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('오류 발생', '게시물 등록 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerTitle: '게시글 작성',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => {
                  if (title.trim() || content.trim() || images.length > 0) {
                    Alert.alert(
                      '작성 취소',
                      '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?',
                      [
                        { text: '계속 작성', style: 'cancel' },
                        { text: '취소', style: 'destructive', onPress: () => router.back() }
                      ]
                    );
                  } else {
                    router.back();
                  }
                }}
                style={styles.headerButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={loading}
                style={styles.headerButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0066cc" />
                ) : (
                  <Text style={styles.postButtonText}>등록</Text>
                )}
              </TouchableOpacity>
            ),
          }}
        />
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* 카테고리 선택 */}
            <View style={styles.categoryContainer}>
              <Text style={styles.labelText}>카테고리</Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.categoryText}>{getCategoryNameById(category)}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              {showCategoryPicker && (
                <View style={styles.categoryDropdown}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        cat.id === category && styles.selectedCategoryOption
                      ]}
                      onPress={() => {
                        setCategory(cat.id);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.categoryOptionText,
                          cat.id === category && styles.selectedCategoryOptionText
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* 제목 입력 */}
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력하세요"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />
            
            {/* 내용 입력 */}
            <TextInput
              style={styles.contentInput}
              placeholder="내용을 입력하세요"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            
            {/* 이미지 미리보기 */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {/* 이미지 업로드 버튼 */}
            {images.length < 5 && (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color="#666" />
                <Text style={styles.uploadButtonText}>
                  이미지 추가 ({images.length}/5)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  headerButton: {
    padding: 8,
  },
  postButtonText: {
    color: '#0066cc',
    fontWeight: '600',
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: 16,
    zIndex: 10,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryDropdown: {
    position: 'absolute',
    top: 78,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f7ff',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryOptionText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  titleInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 200,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imagePreviewWrapper: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
});
