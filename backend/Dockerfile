# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 5000
CMD ["npm", "start"]
