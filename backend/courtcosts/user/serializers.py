from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Calculation, SpendingCalculation

from datetime import datetime, date

from directory.models import Inflation

User = get_user_model()


def calculate_adjusted_price_from_today(price: float, date_start: date) -> float:
    today = date.today()

    if date_start == today:
        return round(price, 2)

    current_date = today
    final_price = price
    step = 1 if today < date_start else -1

    while (step == 1 and current_date <= date_start) or (step == -1 and current_date >= date_start):
        year = current_date.year
        inflation = Inflation.objects.filter(year=year).first()

        if (step == 1 and year == date_start.year) or (step == -1 and year == date_start.year):
            months = abs(date_start.month - current_date.month) + 1
        else:
            months = 12 - current_date.month + 1 if step == 1 else current_date.month

        if inflation:
            monthly_rate = float(inflation.percent) / (12 * 100)
            final_price *= (1 + monthly_rate) ** (step * months)


        if step == 1:
            current_date = date(year + 1, 1, 1)
        else:
            current_date = date(year - 1, 12, 1)

    return round(final_price, 2)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', "first_name", "last_name", "email", "phone_number"]
        read_only_fields = ['id', 'username']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Неверные учетные данные")
        return user


class JWTSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # ДОБАВЛЯЕМ флаги в токен
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['email'] = user.email

        return token



class CalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calculation
        fields = ['id', 'name', 'description', 'sum', 'user']  # Поля, доступные в API
        read_only_fields = ['id', 'user']  # Поля, которые нельзя изменять через API


class SpendingCalculationSerializer(serializers.ModelSerializer):
    adjusted_price = serializers.SerializerMethodField()
    inflation_percent = serializers.SerializerMethodField()

    class Meta:
        model = SpendingCalculation
        fields = [
            'id', 'name', 'description', 'price', 'dateStart', 'dateEnd',
            'refund', 'category', 'calculation', 'withInflation',
            'adjusted_price', 'inflation_percent'
        ]
        read_only_fields = ['id', 'calculation']

    def get_adjusted_price(self, obj):
        if not bool(obj.withInflation):
            return round(float(obj.price), 2)
        else:
            return calculate_adjusted_price_from_today(
                price=float(obj.price),
                date_start=obj.dateStart,
            )

    def get_inflation_percent(self, obj):
        if obj.inflation:
            return float(obj.inflation.percent)
        return None






