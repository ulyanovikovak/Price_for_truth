from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Calculation, SpendingCalculation

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone_number"]


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


class CalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calculation
        fields = ['id', 'name', 'description', 'sum', 'user']  # Поля, доступные в API
        read_only_fields = ['id', 'user']  # Поля, которые нельзя изменять через API


class SpendingCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpendingCalculation
        fields = [
            'id', 'name', 'description', 'price', 'dateStart', 'dateEnd', 'refund',  'category', 'calculation', 'withInflation'
        ]
        read_only_fields = ['id', 'calculation']





