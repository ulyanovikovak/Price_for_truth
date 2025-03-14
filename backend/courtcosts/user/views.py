from rest_framework import generics, status, permissions
from rest_framework.response import Response

from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Calculation, SpendingCalculation
from .serializers import RegisterSerializer, LoginSerializer, JWTSerializer, UserSerializer, CalculationSerializer, \
    SpendingCalculationSerializer

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
    permission_classes = [permissions.IsAuthenticated]  # Проверяет авторизацию пользователя

    # Устанавливает Calculation из запроса
    def perform_create(self, serializer):
        calculation_id = self.request.data.get('calculation')
        try:
            calculation = Calculation.objects.get(id=calculation_id, user=self.request.user)
        except Calculation.DoesNotExist:
            return Response({'error': 'Invalid calculation ID or not authorized'}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(calculation=calculation)

    # Переопределяем метод создания, чтобы добавить статус ответа
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
            'phone': user.phone if hasattr(user, 'phone') else None,
            'calculations': CalculationSerializer(Calculation.objects.filter(user=user), many=True).data
        }
        return Response(user_data)
