# Production Dockerfile for CareGraph AI on Railway
FROM node:20-alpine AS runner

WORKDIR /app

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package manifests and install all dependencies (including devDependencies like TypeScript for @/* path aliases)
COPY package*.json ./
RUN npm install --include=dev

# Copy application source code
COPY . .

# Build Next.js application
RUN npx next build

# Switch to production mode after build
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
