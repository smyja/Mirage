FROM node:16-alpine

# Set working directory

ENV NODE_ENV=production
# Copy package.json and package-lock.json (if available)
WORKDIR /usr/app
COPY ./ /usr/app
COPY web/package*.json ./
RUN npm install

# Copy the built application files


COPY ./web/public ./public

COPY ./node_modules ./node_modules
# Expose the desired port (e.g., 3000)

EXPOSE 3000

# Start the Node.js server
CMD ["npm", "run", "start"]