FROM node:20-alpine

WORKDIR /code

COPY package*.json ./

# Install all deps (dev + prod)
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
