import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Pressable, Linking, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import vicGeoJson from '../../assets/data/vic-postcodes.json';

// 워홀 417 지역 적격 우편번호 데이터
const whv417PostcodesRegional = {
  singlePostcodes: [3139, 3753, 3756, 3758, 3762, 3764, 3979],
  ranges: [
    { start: 3211, end: 3334 },
    { start: 3340, end: 3424 },
    { start: 3430, end: 3649 },
    { start: 3658, end: 3749 },
    { start: 3778, end: 3781 },
    { start: 3810, end: 3909 },
    { start: 3921, end: 3925 },
    { start: 3945, end: 3974 },
    { start: 3979, end: 3996 }
  ]
};

// 워홀 417 리모트 적격 우편번호 데이터
const whv417PostcodesRemote = {
  singlePostcodes: [3424, 3506, 3509, 3512],
  ranges: [
    { start: 3889, end: 3892 },
  ]
};

// 491 비자 적격 우편번호 데이터
const visa491Postcodes = {
  singlePostcodes: [3139, 3329, 3334, 3341, 3235, 3240, 3328],
  ranges: [
    { start: 3097, end: 3099 },
    { start: 3233, end: 3234 },
    { start: 3236, end: 3239 },
    { start: 3241, end: 3325 },
    { start: 3345, end: 3424 },
    { start: 3430, end: 3799 },
    { start: 3809, end: 3909 },
    { start: 3912, end: 3971 },
    { start: 3978, end: 3996 },
    { start: 3211, end: 3232 },
    { start: 3330, end: 3333 },
    { start: 3340, end: 3342 },
  ]
};

// 우편번호가 워홀 417 Regional 적격인지 확인하는 함수
const checkWhv417RegionalEligibility = (postcode) => {
  const postcodeNum = parseInt(postcode, 10);
  
  // 단일 우편번호 확인
  if (whv417PostcodesRegional.singlePostcodes.includes(postcodeNum)) {
    return true;
  }
  
  // 범위 확인
  for (const range of whv417PostcodesRegional.ranges) {
    if (postcodeNum >= range.start && postcodeNum <= range.end) {
      return true;
    }
  }
  
  return false;
};

// 우편번호가 워홀 417 Remote 적격인지 확인하는 함수
const checkWhv417RemoteEligibility = (postcode) => {
  const postcodeNum = parseInt(postcode, 10);
  
  // 단일 우편번호 확인
  if (whv417PostcodesRemote.singlePostcodes.includes(postcodeNum)) {
    return true;
  }
  
  // 범위 확인
  for (const range of whv417PostcodesRemote.ranges) {
    if (postcodeNum >= range.start && postcodeNum <= range.end) {
      return true;
    }
  }
  
  return false;
};

// 491 비자 적격 여부 확인 함수
const check491Eligibility = (postcodeStr) => {
  const postcode = parseInt(postcodeStr);
  
  // 단일 우편번호 확인
  if (visa491Postcodes.singlePostcodes.includes(postcode)) {
    return true;
  }
  
  // 범위 우편번호 확인
  for (const range of visa491Postcodes.ranges) {
    if (postcode >= range.start && postcode <= range.end) {
      return true;
    }
  }
  
  return false;
};

// 비자 필터 타입 정의
const VISA_FILTER = {
  ALL: 'all',
  WHV_417_REGIONAL: 'whv417regional',
  WHV_417_REMOTE: 'whv417remote',
  VISA_491: 'visa491', // 통합된 491 비자 필터
  BOTH: 'both',        // 두 비자 모두 적격
};

// 빅토리아 지역 중심점 좌표
const VICTORIA_REGION = {
  latitude: -37.0202,
  longitude: 144.9994,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

// 빅토리아 지역의 대표적인 우편번호 지역
const SAMPLE_POSTCODES = [
  { 
    postcode: '3139', 
    name: 'Wandin',
    coordinates: { latitude: -37.7768, longitude: 145.4125 },
    eligible: true
  },
  { 
    postcode: '3550', 
    name: 'Bendigo',
    coordinates: { latitude: -36.7570, longitude: 144.2794 },
    eligible: true
  },
  { 
    postcode: '3630', 
    name: 'Shepparton',
    coordinates: { latitude: -36.3833, longitude: 145.4000 },
    eligible: true
  },
  { 
    postcode: '3844', 
    name: 'Moe',
    coordinates: { latitude: -38.1723, longitude: 146.2680 },
    eligible: true
  },
  { 
    postcode: '3350', 
    name: 'Ballarat',
    coordinates: { latitude: -37.5622, longitude: 143.8503 },
    eligible: true
  },
  { 
    postcode: '3875', 
    name: 'Lakes Entrance',
    coordinates: { latitude: -37.8815, longitude: 147.9926 },
    eligible: true
  },
  { 
    postcode: '3690', 
    name: 'Wodonga',
    coordinates: { latitude: -36.1214, longitude: 146.8881 },
    eligible: true
  },
{ 
  postcode: '3220', 
  name: 'Geelong',
  coordinates: { latitude: -38.1499, longitude: 144.3617 },
  eligible: true
}
];

// 우편번호의 비자 자격 메시지를 반환하는 함수
const getVisaEligibilityMessage = (postcodeStr) => {
  if (!postcodeStr) return "No postcode information available.";
  
  const is417Regional = checkWhv417RegionalEligibility(postcodeStr);
  const is417Remote = checkWhv417RemoteEligibility(postcodeStr);
  const is491 = check491Eligibility(postcodeStr);
  
  let message = ``;
  
  if (!is417Regional && !is417Remote && !is491) {
    message += "This area is not eligible for any visa extension.";
    return message;
  }
  
  if (is417Regional) {
    message += "✅ WHV 417 Regional Australia\n";
  }
  
  if (is417Remote) {
    message += "✅ WHV 417 Remote Australia\n";
  }
  
  if (is491) {
    message += "✅ 491 visa\n";
  }
  
  return message;
};

// 우편번호 범위에 대응하는 대략적인 지리적 영역 폴리곤 (시각적 표현용)

// 폴리곤 데이터 초기화

export default function PostcodeFinderScreen() {
  const [region, setRegion] = useState(VICTORIA_REGION);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostcode, setSelectedPostcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filter, setFilter] = useState(VISA_FILTER.ALL);
  const [geoJsonPolygons, setGeoJsonPolygons] = useState([]); // GeoJSON 폴리곤 상태

  // 컴포넌트 마운트 시 폴리곤 데이터 초기화
  useEffect(() => {
    loadGeoJsonData(); // GeoJSON 데이터 로드 (기본 소스)
  
  }, []);

  // GeoJSON 데이터 로드 함수
  const loadGeoJsonData = async () => {
    try {
      setLoading(true);
      
      // 정적 JSON 데이터 사용
      const geoJsonData = vicGeoJson;
      
      // 빅토리아주 폴리곤만 필터링 (예: 3xxx 우편번호)
      const victoriaPolygons = geoJsonData.features
        .filter(feature => {
          // 우편번호 속성이 있는지 확인하고 빅토리아주 우편번호인지 확인
          // 다양한 속성 이름을 확인
          const postcodeProps = ['POA_CODE', 'POA_CODE21', 'POA_NAME', 'POA', 'postcode', 'poa'];
          let postcode = '';
          
          for (const prop of postcodeProps) {
            if (feature.properties && feature.properties[prop]) {
              postcode = feature.properties[prop];
              break;
            }
          }
          
          // 빅토리아주는 3으로 시작하는 우편번호
          return postcode.toString().startsWith('3');
        })
        .map(feature => {
          // 우편번호 정보 추출
          const postcodeProps = ['POA_CODE', 'POA_CODE21', 'POA_NAME', 'POA', 'postcode', 'poa'];
          let postcode = 'Unknown';
          
          for (const prop of postcodeProps) {
            if (feature.properties && feature.properties[prop]) {
              postcode = feature.properties[prop];
              break;
            }
          }

          const postcodeStr = String(postcode);
        
          // 비자 적격성 체크
          const whv417RegionalStatus = checkWhv417RegionalEligibility(postcodeStr);
          const whv417RemoteStatus = checkWhv417RemoteEligibility(postcodeStr);
          const visa491Status = check491Eligibility(postcodeStr);

          // 색상 결정
          let fillColor = 'rgba(200, 200, 200, 0.2)'; // 기본 회색
          let strokeColor = 'rgba(150, 150, 150, 0.8)';
          let visaType = null;

          if (whv417RemoteStatus) {
            fillColor = 'rgba(255, 87, 34, 0.5)'; // 주황색/빨간색
            strokeColor = 'rgba(255, 87, 34, 0.8)';
            visaType = VISA_FILTER.WHV_417_REMOTE;
          } else if (whv417RegionalStatus) {
            fillColor = 'rgba(76, 175, 80, 0.5)'; // 녹색
            strokeColor = 'rgba(76, 175, 80, 0.8)';
            visaType = VISA_FILTER.WHV_417_REGIONAL;
          } else if (visa491Status) {
            fillColor = 'rgba(156, 39, 176, 0.5)'; // 보라색
            strokeColor = 'rgba(156, 39, 176, 0.8)';
            visaType = VISA_FILTER.VISA_491;
          }
        
          // 두 비자 타입 모두에 적격한 경우
          if (whv417RegionalStatus && visa491Status) {
            fillColor = 'rgba(0, 188, 212, 0.5)'; // 청록색
            strokeColor = 'rgba(0, 188, 212, 0.8)';
            visaType = VISA_FILTER.BOTH;
          }

          // 좌표 변환 및 폴리곤 생성
          try {
            if (feature.geometry?.type === 'Polygon') {
              // 폴리곤의 외곽 경계만 사용
              const coordinates = feature.geometry.coordinates[0].map(coord => ({
                latitude: coord[1],
                longitude: coord[0]
              }));
            
              // 폴리곤 추가
              if (coordinates.length > 2) {
                return {
                  id: postcodeStr,
                  name: postcodeStr,
                  coordinates,
                  fillColor,
                  strokeColor,
                  strokeWidth: 1,
                  visaType,
                  isMultiPolygonPart: false
                };
              }
            } 
            else if (feature.geometry?.type === 'MultiPolygon') {
         
              // MultiPolygon의 모든 폴리곤 순회하고 개별적으로 추가
              const polygons = [];
              for (let i = 0; i < feature.geometry.coordinates.length; i++) {
                // 각 폴리곤의 외부 링
                for (let j = 0; j < feature.geometry.coordinates[i].length; j++) {
                  const polygonCoords = feature.geometry.coordinates[i][j];
                
                  if (polygonCoords && polygonCoords.length > 2) {
                    const coordinates = polygonCoords.map(coord => ({
                      latitude: coord[1],
                      longitude: coord[0]
                    }));
                
             
                
                    // 각 폴리곤 부분마다 고유 ID 생성
                    polygons.push({
                      id: `${postcodeStr}-${i}-${j}`,
                      name: postcodeStr,
                      coordinates,
                      fillColor,
                      strokeColor,
                      strokeWidth: 1,
                      visaType,
                      isMultiPolygonPart: true,
                      parentId: postcodeStr
                    });
                  }
                }
              }
              return polygons;
            }
          } catch (error) {
            console.error(`Error processing postcode ${postcode}:`, error);
          }
        });
      
      // 유효한 폴리곤만 사용 (3개 이상의 좌표를 가진 폴리곤)
      const validPolygons = victoriaPolygons.flat().filter(
        polygon => polygon.coordinates && polygon.coordinates.length > 2
      );
      
      
      // 모든 유효 폴리곤을 사용
      setGeoJsonPolygons(validPolygons);
    } catch (error) {
      console.error('GeoJSON 데이터 로드 오류:', error);
      Alert.alert('데이터 로드 오류', 'GeoJSON 파일을 로드하는데 문제가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Location error:', error);
        setErrorMsg('Failed to get location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = () => {
    // 우편번호로 검색
    if (searchQuery.trim() === '') {
      Alert.alert('Search error', 'Please enter a postcode or region name');
      return;
    }

    // 1단계: SAMPLE_POSTCODES에서 먼저 검색
    const foundPostcode = SAMPLE_POSTCODES.find(
      item => item.postcode === searchQuery ||
             item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundPostcode) {
      setRegion({
        latitude: foundPostcode.coordinates.latitude,
        longitude: foundPostcode.coordinates.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      setSelectedPostcode(foundPostcode);
    } else {
      // 2단계: geoJsonPolygons 배열에서 우편번호(id)로 검색
      const geoPolygon = geoJsonPolygons.find(p => p.id === searchQuery);

      if (geoPolygon) {
        // 폴리곤의 대략적인 중심점 계산 (첫번째 좌표를 사용하거나 평균 구하기)
        const coords = geoPolygon.coordinates;
        let centerLat = 0;
        let centerLng = 0;
        coords.forEach(c => {
          centerLat += c.latitude;
          centerLng += c.longitude;
        });
        centerLat /= coords.length;
        centerLng /= coords.length;

        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        });

        Alert.alert(
          `Postcode ${geoPolygon.id}`,
          geoPolygon.visaType === VISA_FILTER.WHV_417_REGIONAL
            ? 'Working Holiday Visa 417 Regional Australia'
            : geoPolygon.visaType === VISA_FILTER.WHV_417_REMOTE
            ? 'Working Holiday Visa 417 Remote Australia'
            : geoPolygon.visaType === VISA_FILTER.VISA_491
            ? '491 visa'
            : geoPolygon.visaType === VISA_FILTER.BOTH
            ? 'Working Holiday Visa 417 and 491 visa'
            : 'This area is not eligible for any visa extension'
        );
        return;
      }

      // 3단계: 단순 우편번호 텍스트 유효성 검사
      if (/^\d{4}$/.test(searchQuery)) {
        const postcode = searchQuery;
        const whvRegionalEligible = checkWhv417RegionalEligibility(postcode);
        const whvRemoteEligible = checkWhv417RemoteEligibility(postcode);
        const visa491Eligible = check491Eligibility(postcode);
        
        // 비자 정보를 한 번에 표시
        let message = "Working Holiday Visa 417 Regional: " + 
                  (whvRegionalEligible ? "✅ Eligible area" : "❌ Ineligible area") + 
                  "\n\n";
        
        // 워홀 리모트 비자 정보
        message += "Working Holiday Visa 417 Remote: " + 
                  (whvRemoteEligible ? "✅ Eligible area" : "❌ Ineligible area") + 
                  "\n\n";
        
        // 491 비자 정보
        message += "491 visa: " + 
                  (visa491Eligible ? "✅ Eligible area" : "❌ Ineligible area");
        
        Alert.alert(`Postcode ${postcode} Eligibility`, message);
      } else {
        Alert.alert('No search results', 'Please try searching with a different postcode or region name.');
      }
    }
  };

  const handleMarkerPress = (postcode) => {
    setSelectedPostcode(postcode);
  };

  const checkCurrentLocation = async () => {
    if (!userLocation) {
      Alert.alert('No location information', 'Unable to retrieve current location. Please check location permissions.');
      return;
    }

    setRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    });
  };

  // 지도 빈 영역 클릭 핸들러 추가
  const handleMapPress = () => {
    // 선택된 우편번호 정보 초기화
    setSelectedPostcode(null);
  };

  // 유저 위치 마커 클릭 핸들러 함수 추가
  const handleMyLocationClick = async () => {
    if (!userLocation) return;
    
    try {
      // 역지오코딩으로 위치의 우편번호 찾기 시도
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      // 우편번호 추출 시도
      const postcode = data.address?.postcode || '3000'; // 기본값 설정
      
      // 선택된 우편번호 정보 설정
      setSelectedPostcode({
        postcode: postcode,
        name: data.address?.suburb || data.address?.city || 'Current Location',
        coordinates: userLocation,
        eligible: checkWhv417RegionalEligibility(postcode) || 
                 checkWhv417RemoteEligibility(postcode) || 
                 check491Eligibility(postcode)
      });
    } catch (error) {
      console.error('Error getting location info:', error);
      Alert.alert('Error', 'Could not determine postcode for this location');
    }
  };



  return (
    <SafeAreaView style={styles.container}>
     
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mapContainer}>
            <MapView 
              style={styles.map}
              initialRegion={region}
              region={region}
              onRegionChangeComplete={setRegion}
              provider="google" 
              onPress={handleMapPress}
            >
              {
              (filter === VISA_FILTER.ALL
                ? geoJsonPolygons
                : geoJsonPolygons.filter(polygon => {
                    // 폴리곤의 우편번호 추출 (일반 폴리곤 또는 MultiPolygon 파트)
                    const postcodeStr = polygon.name || (polygon.id && !polygon.isMultiPolygonPart ? polygon.id : polygon.parentId || '');
                    
                    // 우편번호가 없으면 필터링에서 제외
                    if (!postcodeStr) return false;
                    
                    // 선택된 필터에 따라 적절한 확인 함수 사용
                    if (filter === VISA_FILTER.WHV_417_REGIONAL) {
                      return checkWhv417RegionalEligibility(postcodeStr);
                    }
                    if (filter === VISA_FILTER.WHV_417_REMOTE) {
                      return checkWhv417RemoteEligibility(postcodeStr);
                    }
                    if (filter === VISA_FILTER.VISA_491) {
                      return check491Eligibility(postcodeStr);
                    }
                    
                    // 기본값으로 false 반환
                    return false;
                  })
              ).map((polygonData, index) => {
                // 필터에 따라 폴리곤 색상 설정
                let fillColor = polygonData.fillColor;
                let strokeColor = polygonData.strokeColor;
                
                // 우편번호 추출
                const postcodeStr = polygonData.name || (polygonData.id && !polygonData.isMultiPolygonPart ? polygonData.id : polygonData.parentId || '');
                
                // 필터에 따라 색상 설정
                if (filter === VISA_FILTER.ALL) {
                  // 원래 색상 유지
                } else if (filter === VISA_FILTER.WHV_417_REGIONAL) {
                  fillColor = 'rgba(76, 175, 80, 0.5)'; // 녹색
                  strokeColor = 'rgba(76, 175, 80, 0.8)';
                } else if (filter === VISA_FILTER.WHV_417_REMOTE) {
                  fillColor = 'rgba(255, 87, 34, 0.5)'; // 주황색/빨간색
                  strokeColor = 'rgba(255, 87, 34, 0.8)';
                } else if (filter === VISA_FILTER.VISA_491) {
                  fillColor = 'rgba(178, 29, 198, 0.5)'; // 보라색
                  strokeColor = 'rgba(111, 0, 117, 0.8)';
                }
                
                return (
                  <Polygon
                    key={`polygon-${polygonData.id || index}`}
                    coordinates={polygonData.coordinates}
                    fillColor={fillColor}
                    strokeColor={strokeColor}
                    strokeWidth={polygonData.strokeWidth || 2}
                    tappable
                    onPress={() => {
                      // 우편번호 정보 표시 로직
                      const visaEligibility = getVisaEligibilityMessage(postcodeStr);
                      Alert.alert(`Postcode: ${postcodeStr}`, visaEligibility);
                    }}
                  />
                );
              })}
              
              {/* 대표적인 우편번호 지역 마커 표시 */}
              {SAMPLE_POSTCODES.map((item, index) => {
                // 각 지역의 비자 적격성 확인
                const isWhv417Regional = checkWhv417RegionalEligibility(item.postcode.toString());
                const isWhv417Remote = checkWhv417RemoteEligibility(item.postcode.toString());
                const is491 = check491Eligibility(item.postcode.toString());
                
                // 적격한 비자들을 문자열로 생성
                let eligibleVisas = [];
                if (isWhv417Regional) eligibleVisas.push("417 Regional");
                if (isWhv417Remote) eligibleVisas.push("417 Remote");
                if (is491) eligibleVisas.push("491");
                
                const visaDescription = eligibleVisas.length > 0 
                  ? `Eligible for: ${eligibleVisas.join(', ')}` 
                  : 'Not eligible for any visa';
                  
                return (
                  <Marker
                    key={index}
                    coordinate={item.coordinates}
                    title={`${item.postcode} ${item.name}`}
                    description={visaDescription}
                    pinColor={eligibleVisas.length > 0 ? 'green' : 'red'}
                    onPress={() => handleMarkerPress(item)}
                  />
                );
              })}
              
              {/* 사용자 위치 표시 */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Your Location"
                  pinColor="blue"
                  onPress={handleMyLocationClick}
                />
              )}
            </MapView>
            
            {/* 필터 버튼 */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton, 
                  filter === VISA_FILTER.ALL ? styles.activeFilterButton : null
                ]}
                onPress={() => handleFilterChange(VISA_FILTER.ALL)}
              >
                <Text style={[
                  styles.filterButtonText, 
                  filter === VISA_FILTER.ALL ? styles.activeFilterText : null
                ]}>All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterButton, 
                  filter === VISA_FILTER.WHV_417_REGIONAL ? styles.activeFilterButton : null
                ]}
                onPress={() => handleFilterChange(VISA_FILTER.WHV_417_REGIONAL)}
              >
                <Text style={[
                  styles.filterButtonText, 
                  filter === VISA_FILTER.WHV_417_REGIONAL ? styles.activeFilterText : null
                ]}>417 Regional</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterButton, 
                  filter === VISA_FILTER.WHV_417_REMOTE ? styles.activeFilterButton : null
                ]}
                onPress={() => handleFilterChange(VISA_FILTER.WHV_417_REMOTE)}
              >
                <Text style={[
                  styles.filterButtonText, 
                  filter === VISA_FILTER.WHV_417_REMOTE ? styles.activeFilterText : null
                ]}>417 Remote</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterButton, 
                  filter === VISA_FILTER.VISA_491 ? styles.activeFilterButton : null
                ]}
                onPress={() => handleFilterChange(VISA_FILTER.VISA_491)}
              >
                <Text style={[
                  styles.filterButtonText, 
                  filter === VISA_FILTER.VISA_491 ? styles.activeFilterText : null
                ]}>491</Text>
              </TouchableOpacity>
            </View>
            
            {/* 선택된 우편번호 정보 표시 */}
            {selectedPostcode && (
              <View style={styles.postcodeInfo}>
                <Text style={styles.postcodeTitle}>
                  {selectedPostcode.postcode} {selectedPostcode.name}
                </Text>
                <Text style={[
                  styles.eligibilityText, 
                  { color: selectedPostcode.eligible ? '#34C759' : '#FF3B30' }
                ]}>
                  {(() => {
                    const postcodeStr = selectedPostcode.postcode.toString();
                    const isWhv417Regional = checkWhv417RegionalEligibility(postcodeStr);
                    const isWhv417Remote = checkWhv417RemoteEligibility(postcodeStr);
                    const is491 = check491Eligibility(postcodeStr);
                    
                    let eligibleVisas = [];
                    if (isWhv417Regional) eligibleVisas.push("417 Regional");
                    if (isWhv417Remote) eligibleVisas.push("417 Remote");
                    if (is491) eligibleVisas.push("491");
                    
                    if (eligibleVisas.length === 0) {
                      return 'Not eligible for any visa';
                    } else {
                      return `Eligible for: ${eligibleVisas.join(', ')}`;
                    }
                  })()}
                </Text>
              </View>
            )}
            
            {/* 내 위치 버튼 */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={checkCurrentLocation}
            >
              <FontAwesome name="location-arrow" size={22} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
      
      <View style={styles.searchContainer}>
      {/* <View style={styles.header}> */}
        {/* <Text style={styles.title}>Postcode Finder</Text> */}
        <Text style={styles.subtitle}>Victorian visa eligible regions</Text>
        <Text style={styles.sectionTitle}>Search by postcode</Text>
      {/* </View> */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter postcode or region name (e.g., 3550)"
            placeholderTextColor="#aeaeae" 
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.infoContainer}>
        {/* WHV 417 우편번호 정보 */}
        <Text style={styles.infoTitle}>Working Holiday Visa 417 - Regional</Text>
        <Text style={[styles.infoText, {marginBottom: 20}]}>
          3139, 3211-3334, 3340-3424, 3430-3649, 3658-3749, 3753, 3756, 3758, 3762, 3764, 
          3778-3781, 3783, 3797, 3799, 3810-3909, 3921-3925, 3945-3974, 3979, 3981-3996
        </Text>
  


            {/* WHV 417 Remote 우편번호 정보 */}
            <Text style={styles.infoTitle}>Working Holiday Visa 417 - Remote</Text>
        <Text style={styles.infoText}>
        3424, 3506, 3509, 3512, 3889-3892
        </Text>
        <Text style={styles.sourceText}>
          Source: <Text 
            style={styles.linkText}
            onPress={() => Linking.openURL('https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417/specified-work')}
          >
            immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417/specified-work
          </Text>
        </Text>

        {/* 491 비자 우편번호 정보 */}
        <Text style={[styles.infoTitle, {marginTop: 20}]}>491 visa Eligible Postcodes</Text>
        <Text style={styles.infoText}>
       <Text style={{fontWeight: 'bold'}}>Cities and major regional centres</Text>
       <Text>{'\n'}</Text> 
       <Text style={styles.infoText}>
        3211-3232, 3235, 3240, 3328, 3330-3333, 3340, 3342
          </Text>
          <Text>{'\n'}</Text> 
        <Text style={{fontWeight: 'bold'}}>Regional centres and other regional areas</Text>
       <Text>{'\n'}</Text> 
       <Text style={styles.infoText}>
          3097-3099, 3139,  3233-3234, 3236-3239, 3241-3325, 3329, 3334, 3341, 3345-3424, 3430-3799, 3809-3909, 3912-3971, 3978-3996
          </Text>
        </Text>

        <Text style={styles.sourceText}>
          Source: <Text 
            style={styles.linkText}
            onPress={() => Linking.openURL('https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list/regional-postcodes')}
          >
            immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list/regional-postcodes
          </Text>
        </Text>
        
        <Text style={styles.noteText}>
          Note: This is based on the information provided by the Australian government's immigration website. The information may change, please check the latest information. 
        </Text>


           {/* 문의하기 이메일 섹션 추가 */}
           <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>
      Please feedback us via email:
          </Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL('mailto:kshhhh0640@gmail.com?subject=Feedback')}
          >
            <Text style={styles.emailLink}>kshhhh0640@gmail.com</Text>
          </TouchableOpacity>
          
          {/* 여백 추가 */}
          <View style={{height: 40}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  mapContainer: {
    height: 400,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  postcodeInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  postcodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eligibilityText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 90,
  },
  filterContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
  },
  filterButton: {
    width: 80,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  activeFilterText: {
    color: '#fff',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  searchButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
   // 문의하기 이메일 스타일 추가
   contactSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  emailLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
});  