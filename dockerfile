# Step 1: Specify the base image from the official Node.js repository
FROM node:18-alpine

# Set the working directory in the Docker container
WORKDIR /app

# Copy the package.json and package-lock.json (if available)
# COPY package.json package-lock.json* ./
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# # Add a user and change file ownership
# RUN adduser -D appuser && chown -R appuser /app
# USER appuser

# Expose the port the app runs on
EXPOSE 8500

# Command to run the application
CMD ["node", "server.js"]

# docker build -t crypto-splitter-file-server:latest .
# docker images | grep crypto-splitter-file-server
# docker run -p 8500:8500 crypto-splitter-file-server:latest