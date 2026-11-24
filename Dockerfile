FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
# مجلد البيانات الدائم: اربطه بـ Volume في الاستضافة
ENV DATA_DIR=/data
VOLUME ["/data"]
CMD ["node", "src/index.js"]
