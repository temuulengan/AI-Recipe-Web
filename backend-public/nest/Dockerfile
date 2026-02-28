FROM node:20-alpine

# NestJS 실행 경로
WORKDIR /app

# 의존성 복사 및 설치
COPY package*.json ./
RUN npm ci || npm install

# 소스 복사
COPY . .

# NestJS 빌드 (src → dist)
RUN npm run build || true

EXPOSE 3000
CMD ["node","dist/main.js"]
