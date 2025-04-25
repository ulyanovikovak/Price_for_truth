from rest_framework import serializers
from .models import Categories, Spending, Inflation  # поправь импорт на свой путь

class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = '__all__'

class SpendingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spending
        fields = '__all__'

class InflationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inflation
        fields = '__all__'
