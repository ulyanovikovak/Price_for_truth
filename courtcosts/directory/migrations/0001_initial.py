# Generated by Django 5.1.7 on 2025-03-12 18:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Categories',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=200, null=True, unique=True)),
            ],
            options={
                'verbose_name': 'category',
                'verbose_name_plural': 'categories',
                'db_table': 'category',
            },
        ),
        migrations.CreateModel(
            name='Inflation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(blank=True, max_length=200, null=True, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('percent', models.DecimalField(decimal_places=2, default=0.0, max_digits=3)),
                ('date', models.DateField()),
            ],
            options={
                'verbose_name': 'inflation',
                'verbose_name_plural': 'inflation',
                'db_table': 'inflation',
            },
        ),
        migrations.CreateModel(
            name='Spending',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=200, null=True, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('price', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('date', models.DateField()),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='directory.categories')),
            ],
            options={
                'verbose_name': 'spending',
                'verbose_name_plural': 'spending',
                'db_table': 'spending',
            },
        ),
    ]
