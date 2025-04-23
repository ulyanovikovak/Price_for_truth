from django.contrib import admin
from .models import Categories, Spending, Inflation

admin.site.register(Categories)
admin.site.register(Spending)
admin.site.register(Inflation)


# Register your models here.

# @admin.register(Categories)
# class CategoriesAdmin(admin.ModelAdmin):
#     prepopulated_fields = {'slug': ('name',)}
#
#
# @admin.register(Spending)
# class SpendingAdmin(admin.ModelAdmin):
#     prepopulated_fields = {'slug': ('name',)}
