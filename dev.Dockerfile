# dev.Dockerfile
FROM node:22-alpine

RUN apk add --no-cache \
  build-base python3 autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install -g node-gyp \
  && npm config set fetch-retry-maxtimeout 600000 -g \
  && npm ci

ENV PATH=/opt/app/node_modules/.bin:$PATH

COPY . .
RUN chown -R node:node /opt/app
USER node

VOLUME ["/data", "/opt/app/public/uploads"]

EXPOSE 1337
CMD ["sh", "-c", "npm rebuild better-sqlite3 && rm -rf .cache build node_modules/.strapi && npm run develop"]
