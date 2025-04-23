from django.db import models


class Categories(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        db_table = 'category'
        verbose_name = 'category'  # название для администратора
        verbose_name_plural = 'categories'  # название для администратора множественное

    def __str__(self):
        return self.name


class Spending(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(default=0.0, max_digits=10, decimal_places=2)
    category = models.ForeignKey(to=Categories, on_delete=models.PROTECT)
    refund = models.DecimalField(default=0.0, max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'spending'
        verbose_name = 'spending'
        verbose_name_plural = 'spending'

    def __str__(self):
        return self.name


class Inflation(models.Model):
    # name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    percent = models.DecimalField(default=0.0, max_digits=5, decimal_places=2)
    year = models.IntegerField(null=False)

    # category = models.ForeignKey(to=Categories, on_delete=models.PROTECT)

    class Meta:
        db_table = 'inflation'
        verbose_name = 'inflation'
        verbose_name_plural = 'inflation'

    def __str__(self):
        return str(self.year)

# Create your models here.s
