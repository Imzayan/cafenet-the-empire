# Dockerfile برای backend
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
RUN npm run build
EXPOSE 8090
CMD ["node", "dist/server.js"]
