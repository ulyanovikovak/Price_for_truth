from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import datetime
from .models import Spending, Inflation, Categories

User = get_user_model()


class ViewTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        self.category = Categories.objects.create(name="Тестовая категория")
        self.spending = Spending.objects.create(
            name="Тестовая трата",
            description="Описание траты",
            price=1000,
            refund=100,
            category=self.category
        )
        self.inflation = Inflation.objects.create(
            description="Инфляция за год",
            percent=5.5,
            year=datetime.now().year  # <-- обязательно указываем year
        )

    def test_price_list(self):
        response = self.client.get('/catalog/price/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('consumption', response.json())

    def test_inflation_list(self):
        response = self.client.get('/catalog/inflation/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('inflation', response.json())

    def test_price_id_found(self):
        response = self.client.get(f'/catalog/price/{self.spending.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['id'], self.spending.id)

    def test_price_id_not_found(self):
        response = self.client.get('/catalog/price/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_inflation_id_found(self):
        response = self.client.get(f'/catalog/inflation/{self.inflation.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['id'], self.inflation.id)

    def test_inflation_id_not_found(self):
        response = self.client.get('/catalog/inflation/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_categories_viewset_list(self):
        response = self.client.get('/catalog/admin/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)
        self.assertTrue(len(response.json()) >= 1)

    def test_categories_id_found(self):
        response = self.client.get(f'/catalog/categories/{self.category.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) > 0)

    def test_categories_id_not_found(self):
        response = self.client.get('/catalog/categories/9999/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])


class ViewSetTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        self.category = Categories.objects.create(name="Категория для вьюсета")

    def test_categories_viewset_list(self):
        response = self.client.get('/catalog/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) >= 1)

    def test_spending_viewset_list(self):
        Spending.objects.create(
            name="Трата для вьюсета",
            description="Описание",
            price=500,
            refund=50,
            category=self.category
        )
        response = self.client.get('/catalog/admin/spendings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) >= 1)

    def test_inflation_viewset_list(self):
        Inflation.objects.create(
            description="Инфляция",
            percent=3.2,
            year=datetime.now().year  # <-- обязательно указываем year
        )
        response = self.client.get('/catalog/admin/inflations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) >= 1)
