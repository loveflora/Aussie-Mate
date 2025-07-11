import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect, createContext, useContext } from "react";
import { StyleSheet, Animated, View, Text, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

// 인증 컨텍스트 생성
export const AuthContext = createContext({
  isLoggedIn: false,
  login: (token: string) => {},
  logout: () => {},
  checkAuth: () => {},
});

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 인증 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 사이드바 애니메이션 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0]; // 사이드바 너비
  const fadeAnim = useState(new Animated.Value(0))[0]; // 오버레이 투명도

  // 로그인 함수
  const login = async (token: string) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      setIsLoggedIn(!!token);
      return !!token;
    } catch (error) {
      console.error('인증 확인 중 오류 발생:', error);
      return false;
    }
  };

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // 사이드바 열기
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 사이드바 닫기
  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  // 현재 경로에 따른 타이틀 결정
  const getScreenTitle = () => {
    if (pathname === '/') return '홈';
    if (pathname.startsWith('/jobs')) return '구직 정보';
    if (pathname.startsWith('/housing')) return '주거 정보';
    if (pathname.startsWith('/community')) return '커뮤니티';
    if (pathname.startsWith('/profile')) return '프로필';
    if (pathname === '/settings') return '설정';
    if (pathname === '/login') return '로그인';
    if (pathname === '/signup') return '회원가입';
    if (pathname.startsWith('/visa')) return '비자 지방지역 찾기';
    return 'AussieMate';
  };

  // 현재 경로에 따른 뒤로가기 버튼 표시 여부
  const shouldShowBackButton = () => {
    // 메인 탭 루트 경로들 (뒤로가기 버튼 숨김)
    const mainRoutes = ['/', '/(tabs)'];
    
    // 비자 경로는 항상 뒤로가기 버튼 표시
    if (pathname.startsWith('/visa')) return true;
    
    // 커뮤니티, 구직 등 주요 섹션 루트 페이지에서도 뒤로가기 버튼 표시
    if (pathname === '/community' || pathname === '/jobs' || pathname === '/housing') return true;
    
    // 그 외 경로에 대한 처리
    return !mainRoutes.some(route => pathname === route);
  };

  // 사이드바 메뉴 아이템 컴포넌트
  const SidebarMenuItem = ({ icon, label, onPress }) => {
    const isActive = pathname.startsWith('/' + label.toLowerCase());
    
    return (
      <TouchableOpacity 
        style={[styles.menuItem, isActive && styles.menuItemActive]} 
        onPress={() => {
          onPress();
          closeSidebar();
        }}
      >
        <Ionicons 
          name={icon} 
          size={24} 
          color={isActive ? "#0066cc" : "#333"} 
          style={styles.menuItemIcon} 
        />
        <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // 사이드바 헤더 컴포넌트
  const SidebarHeader = ({ isLoggedIn, login, logout, closeSidebar }) => {
    return (
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarHeaderTop}>
          <Text style={styles.sidebarTitle}>AussieMate</Text>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeSidebarButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {isLoggedIn ? (
          <View style={styles.userInfo}>
            <Ionicons name="person-circle-outline" size={50} color="#0066cc" />
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>사용자</Text>
              <Text style={styles.userEmail}>user@example.com</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => {
              router.push('/login');
              closeSidebar();
            }}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 공통 헤더 컴포넌트
  const GlobalHeader = () => {
    const title = getScreenTitle();
    const showBackButton = shouldShowBackButton();
    const insets = useSafeAreaInsets();
    
    // 뒤로가기 핸들러 함수
    const handleBackPress = () => {
      // 현재 경로 가져오기
      const currentRoute = router.canGoBack();
      const currentPath = router.pathname;
      
      // 뒤로 갈 수 없거나 특정 경로인 경우 홈으로 이동
      if (!currentRoute || currentPath === '/visa/postcode-finder') {
        router.replace('/');
      } else {
        router.back();
      }
    };
    
    return (
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 5 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleBackPress}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.6}
              >
                <View style={styles.backButtonContainer}>
                  <Ionicons name="chevron-back" size={24} color="#333" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={openSidebar}
            >
              <Ionicons name="menu-outline" size={28} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <AuthContext.Provider value={{ isLoggedIn, login, logout, checkAuth }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <GlobalHeader />
          
          <Stack
            screenOptions={{
              headerShown: false, // 모든 화면의 기본 헤더 숨기기
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#f8f8f8', paddingTop: 0 },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="jobs" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="jobs/index" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="jobs/[id]" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="jobs/create" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="housing" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="housing/index" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="community" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="community/index" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="community/[id]" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="community/create" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="login" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="signup" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="visa" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="visa/index" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="visa/postcode-finder" options={{ animation: 'slide_from_right', headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          </Stack>
          
          {/* 사이드바 오버레이 */}
          {isSidebarOpen && (
            <TouchableWithoutFeedback onPress={closeSidebar}>
              <Animated.View 
                style={[
                  styles.sidebarOverlay,
                  { opacity: fadeAnim }
                ]}
              />
            </TouchableWithoutFeedback>
          )}
          
          {/* 사이드바 컨텐츠 */}
          <Animated.View 
            style={[
              styles.sidebar,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <SidebarHeader isLoggedIn={isLoggedIn} login={login} logout={logout} closeSidebar={closeSidebar} />
            
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>메인 메뉴</Text>
              <SidebarMenuItem 
                icon="home-outline" 
                label="홈" 
                onPress={() => router.replace('/')} 
              />
              <SidebarMenuItem 
                icon="briefcase-outline" 
                label="구직 정보" 
                onPress={() => router.replace('/jobs')} 
              />
              <SidebarMenuItem 
                icon="home-outline" 
                label="주거 정보" 
                onPress={() => router.replace('/housing')} 
              />
              <SidebarMenuItem 
                icon="people-outline" 
                label="커뮤니티" 
                onPress={() => router.replace('/community')} 
              />
              <SidebarMenuItem 
                icon="person-outline" 
                label="프로필" 
                onPress={() => router.replace('/profile')} 
              />
              <SidebarMenuItem 
                icon="map-outline" 
                label="비자 지방지역 찾기" 
                onPress={() => router.replace('/visa')} 
              />
            </View>
            
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>설정</Text>
              <SidebarMenuItem 
                icon="settings-outline" 
                label="앱 설정" 
                onPress={() => router.push('/settings')} 
              />
              <SidebarMenuItem 
                icon="help-circle-outline" 
                label="도움말" 
                onPress={() => {}} 
              />
            </View>
          </Animated.View>
        </ThemeProvider>
      </AuthContext.Provider>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0, 
    right: 0, 
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 20,
    paddingTop: 40,

  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 50,
   
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    width: 50, 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 5,
    zIndex: 150,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarHeader: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sidebarHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  closeSidebarButton: {
    padding: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  userInfoText: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  menuSection: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#f8f8f8',
  },
  menuItemIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemTextActive: {
    color: '#0066cc',
  },
});
