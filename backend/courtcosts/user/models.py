from django.contrib.auth.models import AbstractUser
from django.db import models

from directory.models import Inflation, Categories


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


# class UserCategories(models.Model):
#     name = models.CharField(max_length=150, unique=True)
#
#     class Meta:
#         db_table = 'usercategory'
#         verbose_name = 'category'  # название для администратора
#         verbose_name_plural = 'categories'  # название для администратора множественное
#
#     def __str__(self):
#         return self.name


class Calculation(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    sum = models.DecimalField(default=0.0, max_digits=10, decimal_places=2)
    user = models.ForeignKey(to=User, on_delete=models.PROTECT)

    # category = models.ForeignKey(to=Categories, on_delete=models.PROTECT)

    class Meta:
        db_table = 'calculation'
        verbose_name = 'calculation'
        verbose_name_plural = 'calculation'

    def __str__(self):
        return self.name


class SpendingCalculation(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(default=0.0, max_digits=10, decimal_places=2)
    dateStart = models.DateField()
    dateEnd = models.DateField()
    category = models.ForeignKey(to=Categories, on_delete=models.PROTECT)
    calculation = models.ForeignKey(to=Calculation, on_delete=models.PROTECT)
    inflation = models.ForeignKey(Inflation, on_delete=models.CASCADE, null=True, blank=True)
    withInflation = models.BooleanField(default=False)
    refund = models.DecimalField(default=0.0, max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'spendingCalculation'
        verbose_name = 'spendingCalculation'
        verbose_name_plural = 'spendingCalculation'

    def __str__(self):
        return self.name



