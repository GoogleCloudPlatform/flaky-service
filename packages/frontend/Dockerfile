FROM node:12-slim
WORKDIR /usr/src/app
COPY . ./
RUN npm install
RUN npm run build
CMD firebase deploy