const io = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZXMiOlsiUkVOVEVSIl0sImlhdCI6MTc2MzY0NzM3OSwiZXhwIjoxNzYzNjUwOTc5fQ.PmywNig3FnUAo7YWo8iovOsqav9-Z7HwKqocIXi3H0I';

console.log('🔄 Подключаюсь к WebSocket...');
console.log('🔑 Используемый токен:', token);

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: token
  },
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});

socket.on('connect', () => {
  console.log('✅ Подключение установлено!');
  console.log('📡 ID сокета:', socket.id);
  
  // Отправляем joinRoom через 1 секунду
  setTimeout(() => {
    console.log('📤 Отправляю joinRoom...');
    socket.emit('joinRoom', { conversationId: 1 });
  }, 1000);
});

socket.on('joinedRoom', (data) => {
  console.log('✅ Успешно вошли в комнату:', JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
  console.log('❌ Ошибка события:', error);
});

socket.on('connect_error', (error) => {
  console.log('❌ Ошибка подключения:', error.message);
  console.log('🔍 Детали ошибки:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Отключились:', reason);
});

// Завершаем через 10 секунд
setTimeout(() => {
  console.log('⏹️ Завершаю тест...');
  socket.disconnect();
  process.exit(0);
}, 10000);
