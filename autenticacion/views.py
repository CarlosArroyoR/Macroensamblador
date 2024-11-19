from django.shortcuts import get_object_or_404, render, redirect
from django.views.generic import View
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm


# Create your views here.
from .forms import RegistroForm

#El registro de usuario
class VRegistro(View):
    def get(self, request):
        formR = RegistroForm()
        return render(request, "registro/registro.html", {"forma": formR})

    def post(self, request):
        form = RegistroForm(request.POST)

        if form.is_valid():
            usuario = form.save()
            login(request, usuario)
            return redirect("Home")
        else:
            for msg in form.error_messages:
                messages.error(request, form.error_messages[msg])
            return render(request, "registro/registro.html", {"forma": form})

def cerrar_sesion(request):
    logout(request)
    return redirect("Home")

#Inicio de sesion
def logear(request):
    if request.method=="POST":
        #De esta forma guardamos los datos que introdujo el usuario
        form=AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            nombre_usuario=form.cleaned_data.get("username") #se guarda la informacion del username
            contra=form.cleaned_data.get("password")
            usuario=authenticate(username=nombre_usuario, password=contra)#metodo para utenticar el usuario
            if usuario is not None:
                login(request, usuario)
                return redirect("Home")
            else:
                messages.error(request, "usuario no valido")
        else:
            messages.error(request, "informacion incorrecta")
    
    
    form=AuthenticationForm()
    return render(request, "login/login.html", {"formas": form})

