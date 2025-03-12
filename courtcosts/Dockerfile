# Используем Python 3.10
FROM python:3.10

# Устанавливаем netcat
RUN apt-get update && apt-get install -y netcat-openbsd

# Устанавливаем зависимости
WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Копируем файлы приложения
COPY . .

# Даем права на выполнение скриптов
RUN chmod +x entrypoint.sh

# Запускаем entrypoint
CMD ["sh", "entrypoint.sh"]



# docker compose down
# docker compose build --no-cache
# docker compose up -d
# docker logs -f courtcosts_web

