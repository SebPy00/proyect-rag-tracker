# Usamos una imagen oficial de Node.js como base
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el package.json para instalar dependencias
# El * es para que también copie package-lock.json si existe
COPY package*.json ./
RUN npm install

# Copiamos el resto del código del frontend al contenedor
COPY . .

# Exponemos el puerto estándar de React
EXPOSE 3000

# El comando para iniciar la aplicación
CMD ["npm", "start"]