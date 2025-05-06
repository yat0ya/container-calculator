# 🚀 Vite React App Deployment to Portainer (Standalone, No NPM Proxy)

Your app will be accessible at:
`http://tos21.tcn.toya.pl:8080/container-calculator/`

---

## ✅ 1. vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/container-calculator/',
  plugins: [react()],
})
```

---

## ✅ 2. nginx.conf

```nginx
server {
  listen 80;
  server_name localhost;

  location /container-calculator/ {
    alias /usr/share/nginx/html/;
    index index.html;
    try_files $uri $uri/ /index.html;
  }

  location / {
    return 404;
  }
}
```

---

## ✅ 3. Dockerfile

```Dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## ✅ 4. Terminal Commands (Run in Project Root)

```bash
# Install dependencies and build the app
npm install
npm run build

# Package the project (exclude unnecessary folders)
tar --exclude='./node_modules' --exclude='./dist' -czvf container-calculator.tar.gz .
```

---

## ✅ 5. Upload and Deploy in Portainer

1. Go to **Portainer > Images**
2. Upload `container-calculator.tar.gz` and build the image
3. Go to **Containers > Add container**
4. Fill in:

   * **Name**: `container-calculator`
   * **Image**: `container-calculator:latest`
   * **Port mapping**: Host: `8080` → Container: `80`
5. Deploy the container

---

## ✅ 6. Access the App

Open in your browser:
`http://tos21.tcn.toya.pl:8080/container-calculator/`

---

✅ That's it — future deployments are just:

* Rebuild → `npm run build`
* Re-archive → `tar ...`
* Re-upload to Portainer
