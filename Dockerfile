FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source and build it
COPY . .
RUN npm run build

# Install serve to host the static files
RUN npm install -g serve

# Expose the port used by serve
EXPOSE 3004

# Serve the built app under a subpath
CMD ["serve", "-s", "dist", "-l", "3004", "--single"]
