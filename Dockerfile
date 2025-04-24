FROM nginx:stable-alpine

# Create subfolder for your app inside nginx's web root
WORKDIR /usr/share/nginx/html/container-calculator

# Copy your Vite build output to that subfolder
COPY dist/ .

# Add custom nginx config to serve under /container-calculator
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
