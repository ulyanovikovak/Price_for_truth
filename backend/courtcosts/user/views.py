from rest_framework import generics, status, permissions
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from django.db.models import F, Case, When, FloatField, ExpressionWrapper

from datetime import datetime
from rest_framework.exceptions import ValidationError

from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Calculation, SpendingCalculation
from .serializers import RegisterSerializer, LoginSerializer, JWTSerializer, UserSerializer, CalculationSerializer, \
    SpendingCalculationSerializer
from directory.models import Inflation

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # Добавляем токен в черный список
            return Response({"message": "logout"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "error token"}, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateView(APIView):
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated]  # Только авторизованные пользователи

    def put(self, request):
        user = request.user  # Берем текущего пользователя
        serializer = UserSerializer(user, data=request.data, partial=True)  # Разрешаем частичное обновление

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CalculationCreateView(generics.CreateAPIView):
    queryset = Calculation.objects.all()
    serializer_class = CalculationSerializer
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated] # Проверяет авторизацию пользователя

    # Автоматически устанавливает текущего пользователя при создании Calculation
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # Переопределяем метод создания, чтобы добавить статус ответа
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(response.data, status=status.HTTP_201_CREATED)


# Представление API для создания SpendingCalculation
# Доступно только авторизованным пользователям
class SpendingCalculationCreateView(generics.CreateAPIView):
    queryset = SpendingCalculation.objects.all()
    serializer_class = SpendingCalculationSerializer
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated]  # Проверяет авторизацию пользователя

    def perform_create(self, serializer):
        # Получаем расчет
        calculation_id = self.request.data.get('calculation')
        try:
            calculation = Calculation.objects.get(id=calculation_id, user=self.request.user)
        except Calculation.DoesNotExist:
            raise ValidationError({'calculation': 'Invalid calculation ID or not authorized'})

        # Проверка даты начала
        date_str_start = self.request.data.get('dateStart')
        try:
            date_start = datetime.strptime(date_str_start, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            raise ValidationError({'dateStart': 'Invalid or missing date format for dateStart (expected YYYY-MM-DD)'})

        # Проверка даты конца
        date_str_end = self.request.data.get('dateEnd')
        if date_str_end:
            try:
                date_end = datetime.strptime(date_str_end, '%Y-%m-%d').date()
            except (TypeError, ValueError):
                raise ValidationError({'dateEnd': 'Invalid or missing date format for dateEnd (expected YYYY-MM-DD)'})
        else:
            date_end = date_start  # Если дата конца не указана, используем дату начала по умолчанию


        # Пытаемся найти инфляцию
        inflation = Inflation.objects.filter(year=date_start.year).first()

        # Если инфляция найдена, сохраняем инфляцию, иначе с флагом withoutInflation
        if not inflation:
            serializer.validated_data['withInflation'] = False
            serializer.save(calculation=calculation, dateStart=date_start, dateEnd=date_end)
        else:
            serializer.save(calculation=calculation, inflation=inflation, dateStart=date_start, dateEnd=date_end)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(response.data, status=status.HTTP_201_CREATED)

class ProfileView(generics.RetrieveAPIView):
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone_number': user.phone_number if hasattr(user, 'phone_number') else None,
            'calculations': CalculationSerializer(Calculation.objects.filter(user=user), many=True).data
        }
        return Response(user_data)


class CalculationDetailView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]  # Добавляем поддержку JWT
    permission_classes = [IsAuthenticated]
    def get(self, request, calculation_id: int):
        calculation = get_object_or_404(Calculation, id=calculation_id)

        # Аннотация с adjusted_price
        spendings = SpendingCalculation.objects.filter(calculation=calculation).annotate(
            adjusted_price=Case(
                When(
                    withInflation=True,
                    then=ExpressionWrapper(
                        F('price') * (1 + F('inflation__percent') / 100),
                        output_field=FloatField()
                    )
                ),
                default=F('price'),
                output_field=FloatField()
            )
        )

        calc_data = CalculationSerializer(calculation).data
        spendings_data = SpendingCalculationSerializer(spendings, many=True).data

        for obj, annotated in zip(spendings_data, spendings):
            obj['adjusted_price'] = annotated.adjusted_price

        return Response({
            'calculation': calc_data,
            'spendings': spendings_data
        }, status=status.HTTP_200_OK)

class SpendingCalculationDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, user, spending_id):
        return get_object_or_404(SpendingCalculation, id=spending_id, calculation__user=user)

    def get(self, request, spending_id):
        spending = self.get_object(request.user, spending_id)
        serializer = SpendingCalculationSerializer(spending)
        return Response(serializer.data)

    def put(self, request, spending_id):
        spending = self.get_object(request.user, spending_id)
        serializer = SpendingCalculationSerializer(spending, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, spending_id):
        spending = self.get_object(request.user, spending_id)
        spending.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CalculationUpdateDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, user, calculation_id):
        return get_object_or_404(Calculation, id=calculation_id, user=user)

    def put(self, request, calculation_id):
        calculation = self.get_object(request.user, calculation_id)
        serializer = CalculationSerializer(calculation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, calculation_id):
        calculation = self.get_object(request.user, calculation_id)
        # Удаляем сначала связанные траты
        SpendingCalculation.objects.filter(calculation=calculation).delete()
        # Затем сам расчет
        calculation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
