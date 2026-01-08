#!/bin/bash

echo "🚀 Простой запуск MarketingKreis"
echo "================================="

# Остановка
echo "🛑 Остановка процессов..."
killall node 2>/dev/null || true
sleep 2

# Переход в директорию
cd "$(dirname "$0")"

echo "🧹 Очистка кэша..."
cd frontend
rm -rf .next
cd ..

echo "🎨 Запуск простой версии..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Запущен простой Frontend (PID: $FRONTEND_PID)"
echo "🌐 Откройте: http://localhost:3000"
echo ""
echo "⏹️ Остановка: killall node"

# Ожидание и проверка
sleep 10
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Платформа работает!"
    open http://localhost:3000 2>/dev/null || true
else
    echo "⚠️ Платформа еще загружается..."
fi
