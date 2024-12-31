# Указываем базовый образ
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код микросервиса
COPY . .

# Устанавливаем ts-node глобально
RUN npm install -g ts-node

# Указываем порт для прослушивания
EXPOSE 8080

# Команда запуска
CMD ["ts-node", "src/index.ts"]
