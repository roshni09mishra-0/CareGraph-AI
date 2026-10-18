# Production Dockerfile for CareGraph AI on Railway
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --omit=dev

# Copy application files
COPY . .

# Build application
RUN npx next build

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
