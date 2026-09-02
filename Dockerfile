FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
RUN mkdir -p /data
ENV NODE_ENV=production
ENV DB_FILE=/data/ecard.sqlite
EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
