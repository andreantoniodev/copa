FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ls -la

RUN npm install

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]