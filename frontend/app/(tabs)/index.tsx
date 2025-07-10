import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PostcodeFinderScreen from './postcode-finder';

export default function HomeScreen() {

  return (
   <PostcodeFinderScreen/>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressDays: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressTotal: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressRemaining: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  activitySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
