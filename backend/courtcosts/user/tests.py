from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import datetime
from .models import Calculation, SpendingCalculation
from directory.models import Categories
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_login_profile(self):
        response = self.client.post('/register/', {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'testpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post('/login/', {
            'email': 'testuser@example.com',
            'password': 'testpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get('/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')


class CalculationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='testuser2@example.com',
            password='testpassword'
        )
        login = self.client.post('/login/', {
            'email': 'testuser2@example.com',
            'password': 'testpassword'
        })
        self.access_token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_create_calculation(self):
        response = self.client.post('/calculations/create/', {
            'name': 'Test Calculation',
            'description': 'Description',
            'sum': 1000
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_and_delete_calculation(self):
        calc = Calculation.objects.create(
            name='Old Name',
            description='Old Desc',
            sum=500,
            user=self.user
        )

        response = self.client.put(f'/calculations/{calc.id}/', {
            'name': 'New Name'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'New Name')

        response = self.client.delete(f'/calculations/{calc.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Calculation.objects.filter(id=calc.id).exists())


class SpendingCalculationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser3',
            email='testuser3@example.com',
            password='testpassword'
        )
        login = self.client.post('/login/', {
            'email': 'testuser3@example.com',
            'password': 'testpassword'
        })
        self.access_token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        self.category = Categories.objects.create(name="Test Category")
        self.calculation = Calculation.objects.create(
            name='Calculation for Spendings',
            description='Test',
            sum=1500,
            user=self.user
        )

    def test_create_spending(self):
        response = self.client.post('/spending/create/', {
            'name': 'Test Spending',
            'description': 'Desc',
            'price': 100,
            'refund': 10,
            'category': self.category.id,
            'calculation': self.calculation.id,
            'dateStart': datetime.now().date().isoformat(),
            'dateEnd': datetime.now().date().isoformat(),
            'withInflation': False
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Spending')

    def test_get_update_delete_spending(self):
        spending = SpendingCalculation.objects.create(
            name='Spend',
            description='Spend desc',
            price=200,
            refund=20,
            calculation=self.calculation,
            category=self.category,
            dateStart=datetime.now().date(),
            dateEnd=datetime.now().date()
        )

        response = self.client.get(f'/spendings/{spending.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.put(f'/spendings/{spending.id}/', {
            'name': 'Updated Spend',
            'withInflation': False
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Spend')

        response = self.client.delete(f'/spendings/{spending.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SpendingCalculation.objects.filter(id=spending.id).exists())
