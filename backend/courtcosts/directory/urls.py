"""
URL configuration for courtcosts project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

# import sys
# sys.path.append("directory")

from .views import price, price_id, inflation, inflation_id, categories, categories_id, CategoriesViewSet, \
    SpendingViewSet, InflationViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'categories', CategoriesViewSet)
router.register(r'spendings', SpendingViewSet)
router.register(r'inflations', InflationViewSet)


urlpatterns = [
    path('admin/', include(router.urls)),

    path('price/', price),
    path('price/<int:spending_id>/', price_id),
    path('inflation/', inflation),
    path('inflation/<int:inflation_id>/', inflation_id),
    path('categories/', categories),
    path('categories/<int:category_id>/', categories_id),
]
