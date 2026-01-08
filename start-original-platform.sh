#!/bin/bash

echo "🚀 Запуск оригинальной MarketingKreis платформы"
echo "=============================================="

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Остановка процессов
echo -e "${YELLOW}🛑 Остановка существующих процессов...${NC}"
killall node 2>/dev/null || true
sleep 2

# Переход в директорию
cd "$(dirname "$0")"

# Очистка кэша Next.js для быстрого запуска
echo -e "${BLUE}🧹 Очистка кэша Next.js...${NC}"
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

echo -e "${BLUE}🔧 Запуск Backend...${NC}"
cd backend
nohup npm run start:dev > ../backend-fast.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
cd ..

echo -e "${BLUE}🎨 Запуск Frontend...${NC}"
cd frontend
nohup npm run dev > ../frontend-fast.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
cd ..

echo ""
echo -e "${GREEN}✅ Сервисы запущены!${NC}"
echo ""
echo -e "${BLUE}📱 Доступ к платформе:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001/api"
echo ""
echo -e "${YELLOW}⏳ Подождите 30-60 секунд для полной загрузки...${NC}"
echo ""
echo -e "${BLUE}📝 Логи:${NC}"
echo "Backend: tail -f backend-fast.log"
echo "Frontend: tail -f frontend-fast.log"
echo ""
echo -e "${BLUE}⏹️  Остановка: killall node${NC}"

# Автоматическое открытие браузера через 45 секунд
(sleep 45 && open http://localhost:3000) &

echo ""
echo -e "${GREEN}🎉 Платформа запускается! Браузер откроется автоматически через 45 секунд.${NC}"
