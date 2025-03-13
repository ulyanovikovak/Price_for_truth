from django.apps import AppConfig


class DirectoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'directory'   # у админа
    name = 'directory'
