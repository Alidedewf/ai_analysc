# ----- build stage -----
FROM node:18 AS builder

WORKDIR /

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ----- run stage -----
FROM node:18 AS runner

WORKDIR /

# Install simple static server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /dist ./dist

EXPOSE 3000

# Serve the application
CMD ["serve", "-s", "dist", "-l", "3000"]