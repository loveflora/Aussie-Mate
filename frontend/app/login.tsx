import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { userApi } from '@/services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { returnTo } = useLocalSearchParams();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await userApi.login({ email, password });
      
      if (response.data?.token) {
        // 토큰 저장
        await SecureStore.setItemAsync('token', response.data.token);
        
        // 사용자 정보 저장
        if (response.data.user) {
          await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
        }

        // 리디렉션
        if (returnTo) {
          router.replace(returnTo as string);
        } else {
          router.replace('/');
        }
      } else {
        Alert.alert('로그인 실패', '인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      Alert.alert('로그인 오류', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 테스트용 간편 로그인 (실제 배포 시 제거)
  const handleTestLogin = async () => {
    setLoading(true);
    
    try {
      // 테스트용 토큰 생성 (실제로는 서버에서 받아와야 함)
      const testToken = 'test_token_' + Date.now();
      const testUser = { id: 1, name: '테스트 사용자', email: 'test@example.com' };
      
      // 토큰 저장
      await SecureStore.setItemAsync('token', testToken);
      
      // 사용자 정보 저장
      await SecureStore.setItemAsync('user', JSON.stringify(testUser));
      
      // 리디렉션
      if (returnTo) {
        router.replace(returnTo as string);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('테스트 로그인 오류:', error);
      Alert.alert('오류', '로그인 처리 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '로그인',
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>AussieMate</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>로그인</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestLogin}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>테스트 계정으로 로그인</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>계정이 없으신가요?</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#666',
    fontSize: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signupText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
