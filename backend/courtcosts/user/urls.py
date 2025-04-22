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
from django.urls import path

from .views import RegisterView, LoginView, LogoutView, CalculationCreateView, SpendingCalculationCreateView, \
    ProfileView, UserUpdateView, CalculationDetailView, SpendingCalculationDetailView, CalculationUpdateDeleteView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    # Эндпоинт для создания Calculation (только для авторизованных пользователей)
    path('calculations/create/', CalculationCreateView.as_view(), name='calculation-create'),

    # Эндпоинт для создания SpendingCalculation внутри Calculation (только для авторизованных пользователей)
    path('spending/create/', SpendingCalculationCreateView.as_view(), name='spending-calculation-create'),

    path('spendings/<int:spending_id>/', SpendingCalculationDetailView.as_view(), name='spending-detail'),

    path('calculation/<int:calculation_id>/details/', CalculationDetailView.as_view(), name='calculation-detail'),

    path('calculations/<int:calculation_id>/', CalculationUpdateDeleteView.as_view(), name='calculation-update-delete'),

    # Эндпоинт для получения данных пользователя и его расчетов
    path('profile/', ProfileView.as_view()),

    path("update-profile/", UserUpdateView.as_view(), name="update-profile"),
]
