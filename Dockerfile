# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy package.json and yarn.lock
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy project files
COPY . .

# Build the app
RUN yarn build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy built files from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy themes directory directly from host
COPY themes/ /usr/share/nginx/html/themes/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
