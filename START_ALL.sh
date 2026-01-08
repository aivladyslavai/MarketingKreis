#!/bin/bash

echo "🚀 ЗАПУСК ПЛАТФОРМЫ MARKETING KREIS"
echo "=================================="

# Остановка всех процессов
echo "🛑 Останавливаю все процессы..."
killall -9 node 2>/dev/null || true
killall -9 python 2>/dev/null || true
sleep 2

# Переход в корневую директорию
cd "$(dirname "$0")"

echo "📍 Текущая директория: $(pwd)"

# Запуск Backend
echo ""
echo "🔧 ЗАПУСК BACKEND..."
cd backend
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено!"
    exit 1
fi

source venv/bin/activate
echo "✅ Виртуальное окружение активировано"

# Запуск backend в фоне
python -m uvicorn app.main:app --host 127.0.0.1 --port 3001 --reload &
BACKEND_PID=$!
echo "✅ Backend запущен (PID: $BACKEND_PID)"

# Переход к frontend
cd ../frontend
echo ""
echo "🎨 ЗАПУСК FRONTEND..."

# Очистка кеша
rm -rf .next
echo "✅ Кеш очищен"

# Запуск frontend в фоне
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend запущен (PID: $FRONTEND_PID)"

# Ожидание запуска
echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка статуса
echo ""
echo "🔍 ПРОВЕРКА СТАТУСА:"
curl -s -o /dev/null -w "Backend API: %{http_code}\n" http://127.0.0.1:3001/health || echo "Backend API: не отвечает"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://127.0.0.1:3000 || echo "Frontend: не отвечает"

echo ""
echo "🎉 ПЛАТФОРМА ЗАПУЩЕНА!"
echo "=================================="
echo "🔐 ДАННЫЕ ДЛЯ ВХОДА:"
echo "URL: http://localhost:3000"
echo "Email: admin@marketingkreis.ch"
echo "Password: admin123"
echo ""
echo "💡 Нажмите Ctrl+C для остановки"

# Ожидание сигнала остановки
trap 'echo ""; echo "🛑 Останавливаю сервисы..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Бесконечный цикл для поддержания скрипта
while true; do
    sleep 1
done
