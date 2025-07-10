#!/bin/bash
echo "===== 백엔드 서버 접속 테스트 ====="

# 현재 IP 주소 확인
echo "현재 네트워크 IP 주소:"
IP=$(ipconfig getifaddr en0)
echo "en0 (WiFi): $IP"

echo ""
echo "=== localhost:5000 접속 테스트 ==="
curl -s -o /dev/null -w "응답 코드: %{http_code}\n" http://localhost:5000

echo ""
echo "=== localhost:5000/api/jobs 테스트 ==="
curl http://localhost:5000/api/jobs

echo ""
echo "=== 네트워크 포트 확인 ==="
echo "포트 5000 리슨 상태:"
lsof -i :5000

echo ""
echo "=== 서버 프로세스 확인 ==="
ps -ef | grep node | grep -v grep

echo ""
echo "테스트 완료!"
