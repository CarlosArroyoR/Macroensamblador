import os
from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User

def validate_z80_extension(file):
    ext = os.path.splitext(file.name)[1] 
    if ext.lower() != '.asm':
        raise ValidationError('Solo se permiten archivos con extensión .asm')
    

###### Modelo de base de datos #####
class archivo(models.Model):
    nombre = models.CharField(max_length=50, default="Sin nombre")
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    archivo_z80 = models.FileField(upload_to='z80_files/', validators=[validate_z80_extension])

