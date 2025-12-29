# Use Node 18 (LTS) as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies (root and server)
# Note: Since there's one package.json managing everything in root, we just run npm install there.
# If server has its own, we might need to install there too, but let's assume root covers it or we run install in root.
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose the API port
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "server"]
