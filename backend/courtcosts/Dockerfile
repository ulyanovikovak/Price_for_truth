FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN apt-get update && apt-get install -y netcat-openbsd
RUN chmod +x entrypoint.sh

CMD ["sh", "entrypoint.sh"]





# docker compose down
# docker compose build --no-cache
# docker compose up -d
# docker logs -f courtcosts_web

