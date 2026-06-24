from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

class LoginUsuarioTestCase(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_test",
            password="password123",
            email="admin_test@nexis.pe"
        )
        self.inactive_user = User.objects.create_user(
            username="inactive_test",
            password="password123",
            email="inactive_test@nexis.pe",
            is_active=False
        )
        self.login_url = "/api/usuarios/login/"

    def test_login_exitoso(self):
        response = self.client.post(
            self.login_url,
            {"username": "admin_test", "password": "password123"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("usuario", response.data)
        self.assertEqual(response.data["usuario"]["username"], "admin_test")
        
        token_exists = Token.objects.filter(key=response.data["token"]).exists()
        self.assertTrue(token_exists)

    def test_login_credenciales_invalidas(self):
        response = self.client.post(
            self.login_url,
            {"username": "admin_test", "password": "wrong_password"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("token", response.data)
        self.assertEqual(response.data["error"], "Credenciales incorrectas.")

    def test_login_usuario_inactivo(self):
        response = self.client.post(
            self.login_url,
            {"username": "inactive_test", "password": "password123"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("token", response.data)
        self.assertEqual(response.data["error"], "El usuario está inactivo.")

    def test_login_campos_faltantes(self):
        response = self.client.post(
            self.login_url,
            {"username": ""},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Usuario y contraseña son obligatorios.")
