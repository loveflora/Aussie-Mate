#!/bin/bash
echo "백엔드 서버를 재시작합니다..."

# 기존에 실행 중인 Node.js 프로세스 찾아서 종료
echo "기존에 실행 중인 서버를 종료합니다..."
pkill -f "node.*server.js" || true

# 잠시 대기
sleep 2

# 서버가 모든 인터페이스에서 접속을 허용하도록 환경 변수 설정
export HOST=0.0.0.0

# 서버 시작
echo "서버를 새로 시작합니다..."
cd "$(dirname "$0")"
node server.js
