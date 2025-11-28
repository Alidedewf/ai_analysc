# ----- build stage -----
FROM node:18-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копируем исходники и собираем
COPY . .
RUN npm run build   # Vite -> dist, CRA -> build (см. ниже)

# ----- run stage -----
FROM node:18-alpine AS runner

WORKDIR /

# Устанавливаем простой статический сервер
RUN npm install -g serve

# Копируем собранный фронт
# Если у тебя Vite:
COPY --from=builder /app/dist ./dist
# Если Create React App — нужно поменять на:
# COPY --from=builder /app/build ./dist

EXPOSE 3000

# -s = single-page app (SPA), все роуты → index.html
# -l 3000 = порт
CMD ["serve", "-s", "dist", "-l", "3000"]