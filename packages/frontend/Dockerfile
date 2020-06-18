WORKDIR /usr/src/app
COPY . ./
RUN npm install
RUN npm run build
CMD firebase deploy