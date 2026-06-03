# ─────────────────────────────────────────────
# STAGE 1: Build — Node 20 Alpine
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el resto del código fuente y compilar
COPY . .
RUN npm run build
# El output queda en /app/dist

# ─────────────────────────────────────────────
# STAGE 2: Serve — Nginx Alpine (imagen mínima)
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Eliminar config default de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copiar nuestra configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto expuesto (Nginx escucha en 80)
EXPOSE 80

# SIGTERM para que Swarm pueda detener el contenedor limpiamente
STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]