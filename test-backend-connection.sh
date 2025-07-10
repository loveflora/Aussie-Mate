#!/bin/bash
echo "백엔드 서버 연결 테스트 중..."

# 현재 IP 주소 확인
echo "현재 네트워크 IP 주소:"
IP=$(ipconfig getifaddr en0)
echo "en0 (WiFi): $IP"

echo ""
echo "== 백엔드 서버 접속 테스트 =="
echo "localhost:5000 테스트:"
curl -m 5 http://localhost:5000

echo ""
echo "$IP:5000 테스트:"
curl -m 5 http://$IP:5000

echo ""
echo "== API 엔드포인트 테스트 =="
echo "localhost:5000/api/jobs 테스트:"
curl -m 5 http://localhost:5000/api/jobs

echo ""
echo "$IP:5000/api/jobs 테스트:"
curl -m 5 http://$IP:5000/api/jobs

echo ""
echo "== 백엔드 서버 프로세스 확인 =="
lsof -i :5000
