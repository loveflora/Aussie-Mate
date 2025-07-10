#!/bin/bash
echo "컴퓨터의 네트워크 정보 확인 중..."

# 맥에서 WiFi 인터페이스 이름 (en0이 일반적으로 WiFi)
echo "WiFi (en0) IP 주소:"
ipconfig getifaddr en0

echo ""
echo "이더넷 (en1) IP 주소:"
ipconfig getifaddr en1

echo ""
echo "모든 네트워크 인터페이스 정보:"
ifconfig | grep "inet " | grep -v 127.0.0.1

echo ""
echo "== 중요 =="
echo "위 IP 주소 중 하나를 선택하여 frontend/services/api.ts 파일에 있는"
echo "API_URL 값으로 설정하세요. (예: http://192.168.X.X:5000/api)"
