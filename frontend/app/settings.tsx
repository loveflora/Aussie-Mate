import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './_layout';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
  // 설정 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { isLoggedIn, logout } = useContext(AuthContext);

  // 로그아웃 처리
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ],
    );
  };

  // 계정 삭제 처리
  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: () => {
            // API 호출로 계정 삭제 처리
            Alert.alert('계정이 삭제되었습니다.');
            logout();
            router.replace('/');
          },
          style: 'destructive',
        },
      ],
    );
  };

  // 설정 섹션 컴포넌트
  const SettingSection = ({ title, children }) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  // 설정 항목 컴포넌트 (토글 스위치)
  const SettingItemToggle = ({ icon, title, description, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={24} color="#0066cc" style={styles.settingIcon} />
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d1d6', true: '#4cd964' }}
        thumbColor="#ffffff"
      />
    </View>
  );

  // 설정 항목 컴포넌트 (버튼)
  const SettingItemButton = ({ icon, title, description, onPress, destructive = false }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={destructive ? "#ff3b30" : "#0066cc"} 
          style={styles.settingIcon} 
        />
        <View>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, destructive && styles.destructiveText]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <SettingSection title="앱 설정">
        <SettingItemToggle
          icon="moon-outline"
          title="다크 모드"
          description="어두운 테마로 변경합니다"
          value={isDarkMode}
          onValueChange={setIsDarkMode}
        />
        <SettingItemToggle
          icon="notifications-outline"
          title="푸시 알림"
          description="새로운 소식과 업데이트를 받습니다"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        <SettingItemToggle
          icon="mail-outline"
          title="이메일 알림"
          description="이메일로 알림을 받습니다"
          value={emailNotifications}
          onValueChange={setEmailNotifications}
        />
      </SettingSection>

      <SettingSection title="계정">
        {isLoggedIn ? (
          <>
            <SettingItemButton
              icon="person-outline"
              title="내 정보 관리"
              description="개인정보 및 프로필 설정"
              onPress={() => router.push('/profile')}
            />
            <SettingItemButton
              icon="log-out-outline"
              title="로그아웃"
              onPress={handleLogout}
            />
            <SettingItemButton
              icon="trash-outline"
              title="계정 삭제"
              description="모든 데이터가 영구적으로 삭제됩니다"
              onPress={handleDeleteAccount}
              destructive={true}
            />
          </>
        ) : (
          <SettingItemButton
            icon="log-in-outline"
            title="로그인"
            description="계정에 로그인하세요"
            onPress={() => router.push('/login')}
          />
        )}
      </SettingSection>

      <SettingSection title="정보">
        <SettingItemButton
          icon="information-circle-outline"
          title="앱 정보"
          description="AussieMate 버전 1.0.0"
          onPress={() => {}}
        />
        <SettingItemButton
          icon="document-text-outline"
          title="이용약관"
          onPress={() => {}}
        />
        <SettingItemButton
          icon="shield-checkmark-outline"
          title="개인정보 처리방침"
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title="지원">
        <SettingItemButton
          icon="help-circle-outline"
          title="도움말"
          onPress={() => {}}
        />
        <SettingItemButton
          icon="chatbox-outline"
          title="피드백 보내기"
          onPress={() => {}}
        />
      </SettingSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  settingSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    marginHorizontal: 15,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  destructiveText: {
    color: '#ff3b30',
  },
});
