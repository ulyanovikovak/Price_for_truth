from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Calculation, SpendingCalculation
from .serializers import (
    RegisterSerializer, LoginSerializer, JWTSerializer, UserSerializer,
    CalculationSerializer, SpendingCalculationSerializer, CustomTokenObtainPairSerializer
)
from directory.models import Inflation
from django.contrib.auth import get_user_model
from datetime import datetime

User = get_user_model()


def to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes')
    return bool(value)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "logout"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "error token"}, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        calculations = CalculationSerializer(Calculation.objects.filter(user=user), many=True).data
        user_data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'username': user.username,
            'phone_number': getattr(user, 'phone_number', None),
            'calculations': calculations
        }
        return Response(user_data)


class CalculationCreateView(generics.CreateAPIView):
    queryset = Calculation.objects.all()
    serializer_class = CalculationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SpendingCalculationCreateView(generics.CreateAPIView):
    queryset = SpendingCalculation.objects.all()
    serializer_class = SpendingCalculationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        calculation_id = self.request.data.get('calculation')
        calculation = get_object_or_404(Calculation, id=calculation_id, user=self.request.user)

        date_start = datetime.strptime(self.request.data.get('dateStart'), '%Y-%m-%d').date()
        date_end_str = self.request.data.get('dateEnd')
        date_end = datetime.strptime(date_end_str, '%Y-%m-%d').date() if date_end_str else date_start

        inflation = Inflation.objects.filter(year=date_start.year).first()
        if inflation:
            serializer.save(calculation=calculation, inflation=inflation, dateStart=date_start, dateEnd=date_end)
        else:
            serializer.save(calculation=calculation, dateStart=date_start, dateEnd=date_end)


class CalculationDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, calculation_id: int):
        calculation = get_object_or_404(Calculation, id=calculation_id)
        spendings = SpendingCalculation.objects.filter(calculation=calculation)  # ← БЕЗ annotate!

        calc_data = CalculationSerializer(calculation).data
        spendings_data = SpendingCalculationSerializer(spendings, many=True).data

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
            date_start_str = request.data.get('dateStart') or spending.dateStart.strftime('%Y-%m-%d')
            date_start = datetime.strptime(date_start_str, '%Y-%m-%d').date()

            with_inflation = to_bool(request.data.get('withInflation', spending.withInflation))
            inflation = Inflation.objects.filter(year=date_start.year).first() if with_inflation else None

            serializer.save(withInflation=bool(inflation), inflation=inflation)
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
        SpendingCalculation.objects.filter(calculation=calculation).delete()
        calculation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
