FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install native dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all other project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
