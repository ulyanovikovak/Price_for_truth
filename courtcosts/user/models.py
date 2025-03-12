from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    class Meta:
        db_table = 'user'
        verbose_name = 'user'  # название для администратора
        verbose_name_plural = 'users'  # название для администратора множественное

    def __str__(self):
        return self.username
