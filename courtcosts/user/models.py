# from django.contrib.auth.models import AbstractUser
# from django.db import models
#
#
# # Create your models here.
# class User(AbstractUser):
#     # image = models.ImageField(uploud_to='users_images', blank=True,null=True)
#     class Meta:
#         db_table = 'user'
#         verbose_name = 'user'  # название для администратора
#         verbose_name_plural = 'users'  # название для администратора множественное
#
#     def __str__(self):
#         return self.username
