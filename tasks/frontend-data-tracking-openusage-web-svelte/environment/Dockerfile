FROM node:20-alpine
WORKDIR /app
COPY solution/app/package*.json ./
RUN npm ci
COPY solution/app ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
