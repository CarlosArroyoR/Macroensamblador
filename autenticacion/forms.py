from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class RegistroForm(UserCreationForm):
    email = forms.EmailField(max_length=254, label='Correo electronico')
    first_name = forms.CharField(max_length=30, label='Nombre/s')
    last_name = forms.CharField(max_length=30, label='Apellidos')

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

        
