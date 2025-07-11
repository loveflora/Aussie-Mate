import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './_layout';

export default function ProfileScreen() {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/login');
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 섹션 컴포넌트
  const ProfileSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
  
  // 메뉴 항목 컴포넌트
  const MenuItem = ({ icon, title, onPress, rightContent = null }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color="#0066cc" style={styles.menuIcon} />
        <Text style={styles.menuItemTitle}>{title}</Text>
      </View>
      {rightContent ? rightContent : <Ionicons name="chevron-forward" size={18} color="#ccc" />}
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView>
        {isLoggedIn ? (
          // 로그인 상태 - 프로필 정보 표시
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="#ffffff" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>사용자</Text>
                <Text style={styles.profileEmail}>user@example.com</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>프로필 편집</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ProfileSection title="계정 설정">
              <MenuItem 
                icon="person-circle-outline" 
                title="내 정보 관리" 
                onPress={() => {}} 
              />
              <MenuItem 
                icon="notifications-outline" 
                title="알림 설정" 
                onPress={() => {}} 
              />
              <MenuItem 
                icon="shield-checkmark-outline" 
                title="개인정보 및 보안" 
                onPress={() => {}} 
              />
            </ProfileSection>
            
            <ProfileSection title="내 활동">
              <MenuItem 
                icon="bookmark-outline" 
                title="저장된 항목" 
                onPress={() => {}} 
              />
              <MenuItem 
                icon="document-text-outline" 
                title="내 게시물" 
                onPress={() => {}} 
              />
              <MenuItem 
                icon="briefcase-outline" 
                title="내 구직 정보" 
                onPress={() => {}} 
              />
            </ProfileSection>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          // 비로그인 상태 - 로그인 유도 화면
          <View style={styles.notLoggedInContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#cccccc" />
            <Text style={styles.notLoggedInTitle}>로그인이 필요합니다</Text>
            <Text style={styles.notLoggedInText}>
              프로필을 보기 위해서는 로그인이 필요합니다.
              로그인하고 AussieMate의 모든 기능을 이용해보세요.
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>로그인하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  editButtonText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemTitle: {
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  notLoggedInContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: 500,
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notLoggedInText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
