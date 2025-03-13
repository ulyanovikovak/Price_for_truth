#!/bin/sh
set -e  # Завершает выполнение при ошибке


# Ожидание доступности базы данных
echo " Ожидание базы данных..."
while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
  echo " Ожидание базы данных ($DATABASE_HOST:$DATABASE_PORT)..."
  sleep 1
done

echo " База данных доступна!"

# Применение миграций
echo " Применение миграций..."
python manage.py migrate --noinput

# Создание суперпользователя (если его нет)ls -l entrypoint.sh
echo " Проверка суперпользователя..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "adminpassword1")
    print(" Суперпользователь создан")
else:
    print(" Суперпользователь уже существует")
EOF

# Запуск сервера Django
echo " Запуск сервера Django..."
exec python manage.py runserver 0.0.0.0:8000



