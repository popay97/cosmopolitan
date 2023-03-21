FROM node:14-alpine AS build

WORKDIR /frontend

COPY package*.json ./

RUN npm install

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer


COPY . .

EXPOSE 3000

CMD npm run dev

