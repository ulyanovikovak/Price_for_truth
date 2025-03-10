from django.http import HttpResponse
from django.shortcuts import render

from .models import Spending


# Create your views here.

def price(request):
    # spending = Spending
    return HttpResponse('lala')