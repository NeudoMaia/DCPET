FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm install --omit=dev

# Copiar todos os arquivos da aplicação
COPY . .

# Expor a porta 3005
EXPOSE 3005

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

# Iniciar servidor Express
CMD ["node", "server.js"]
