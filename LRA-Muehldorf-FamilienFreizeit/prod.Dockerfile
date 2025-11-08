# ===== Build stage =====
FROM node:22-alpine AS build
RUN apk add --no-cache \
  build-base python3 autoconf automake zlib-dev libpng-dev nasm vips-dev git bash

WORKDIR /opt/app
ENV npm_config_build_from_source=true

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV NODE_ENV=production
ENV PATH=/opt/app/node_modules/.bin:$PATH
RUN npm rebuild better-sqlite3 sharp --build-from-source || true
RUN npm run build
RUN npm prune --omit=dev

# ===== Runtime stage =====
FROM node:22-alpine
RUN apk add --no-cache vips sqlite-libs bash

WORKDIR /opt/app

# important: same volume path as dev
VOLUME ["/data", "/opt/app/public/uploads"]

COPY --from=build /opt/app /opt/app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337 \
    PATH=/opt/app/node_modules/.bin:$PATH

EXPOSE 1337
CMD ["npm", "run", "start"]
