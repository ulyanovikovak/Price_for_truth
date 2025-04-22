from django.http import HttpResponse, JsonResponse
from django.shortcuts import render

from .models import Spending, Inflation, Categories


# Create your views here.

def price(request):
    consumption = list(Spending.objects.all().values())  # Преобразуем QuerySet в список словарей
    context = {
        'consumption': consumption
    }

    return JsonResponse(context, safe=False)  # safe=False нужен для списка


def inflation(request):
    inflations = list(Inflation.objects.all().values())  # Преобразуем QuerySet в список словарей
    context = {
        'inflation': inflations
    }

    return JsonResponse(context, safe=False)  # safe=False нужен для списка


def price_id(request, spending_id):
    try:
        spending = Spending.objects.get(id=spending_id)
        context = {
            'id': spending.id,
            'name': spending.name,  # Замените на реальные поля модели
            'description': spending.description,
            'price': spending.price,
            'refund': spending.refund,
            'category': spending.category.name if spending.category else None,
        }
        return JsonResponse(context)
    except Spending.DoesNotExist:
        return JsonResponse({'error': 'object not found'}, status=404)


def categories(request):
    category = list(Categories.objects.all().values())  # Преобразуем QuerySet в список словарей
    context = {
        'category': category
    }

    return JsonResponse(context, safe=False)  # safe=False нужен для списка


def inflation_id(request, inflation_id):
    try:
        inflation = Inflation.objects.get(id=inflation_id)
        context = {
            'id': inflation.id,
            'description': inflation.description,
            'percent': inflation.percent,
        }
        return JsonResponse(context)
    except Spending.DoesNotExist:
        return JsonResponse({'error': 'object not found'}, status=404)


def categories_id(request, category_id):
    try:
        spendings = list(Spending.objects.filter(category__id=category_id).values())
        return JsonResponse(spendings, safe=False)
    except Spending.DoesNotExist:
        return JsonResponse({'error': 'object not found'}, status=404)

