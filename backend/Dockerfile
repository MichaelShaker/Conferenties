FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set audit false \
    && npm config set fund false

RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
