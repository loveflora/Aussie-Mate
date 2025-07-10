import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { View, Text } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PostcodeFinderScreen from './postcode-finder';
import { Linking } from 'react-native';

export default function HomeScreen() {
  const [activeScreen, setActiveScreen] = useState('postcodeFinder');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'postcodeFinder':
        return <PostcodeFinderScreen />;
      default:
        return <PostcodeFinderScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AussieMate</Text>
        <Text style={styles.welcomeText}>호주에서의 생활을 더 쉽게</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuItem, activeScreen === 'postcodeFinder' && styles.activeMenuItem]} 
          onPress={() => setActiveScreen('postcodeFinder')}
        >
          <Text style={styles.menuText}>비자 우편번호</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/jobs')}
        >
          <Text style={styles.menuText}>구직 정보</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/housing')}
        >
          <Text style={styles.menuText}>주거 정보</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/community')}
        >
          <Text style={styles.menuText}>커뮤니티</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>추가 정보</Text>
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={() => Linking.openURL('https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417')}
        >
          <Text style={styles.linkText}>• WHV 417 비자 정보 보기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkItem}
          onPress={() => Linking.openURL('https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491')}
        >
          <Text style={styles.linkText}>• 491 비자 정보 보기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => Linking.openURL('mailto:support@whmate.com.au?subject=WHMate App 문의')}
        >
          <Text style={styles.contactText}>문의하기: support@whmate.com.au</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeMenuItem: {
    backgroundColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 13,
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linkItem: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#0066cc',
    fontSize: 14,
  },
  contactItem: {
    marginTop: 8,
    paddingVertical: 6,
  },
  contactText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
