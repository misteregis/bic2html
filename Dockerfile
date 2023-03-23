FROM node:17

# Entra no diretório da aplicação
WORKDIR /home/node/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install --silent

# Copia toda a aplicação
COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
