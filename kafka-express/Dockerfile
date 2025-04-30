FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/server.js"]