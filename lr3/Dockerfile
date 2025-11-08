FROM node:18-alpine

WORKDIR /app

# Устанавливаем зависимости для генерации SSL
RUN apk add --no-cache openssl

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Собираем клиентскую часть
RUN npm run build:gulp
RUN npm run build:webpack

EXPOSE 3000

CMD ["npm", "start"]
