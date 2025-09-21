# Usamos una imagen oficial de Python como base
FROM python:3.11-slim

# Evita que Python escriba archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# Evita que Python guarde en buffer el output, para ver los logs en tiempo real
ENV PYTHONUNBUFFERED 1

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el archivo de dependencias y las instalamos
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiamos el resto del código del backend al contenedor
COPY . .