import json
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render, HttpResponse
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.conf.urls import handler404
from django.views.decorators.csrf import csrf_exempt
from .models import archivo as ARCHIVO
from django.core.files.base import ContentFile


###### Vista de pagina inicial #####
def home(request):
    if request.user.is_authenticated:
        try:
            archivos = list(ARCHIVO.objects.filter(usuario=request.user).values())
            archivos = json.dumps(archivos)
            return render(request, "aplicacion/index.html", {"archivos":archivos}) 
        except Exception as e:
             return render(request, "aplicacion/index.html") 
    return render(request, "aplicacion/index.html") 


###### Vista para guardar un archivo #####
@csrf_exempt  # Para facilitar el desarrollo; asegúrate de usar CSRF token en producción
def guardar_archivo_nuevo(request): 
    if request.method == 'POST':
        nombre = request.POST.get('nombre')  # Obtiene el nombre del archivo sin extensión
        if not nombre:
            return JsonResponse({'error': 'El nombre del archivo es obligatorio.'}, status=400)
        
        # Asegura que el nombre tenga la extensión .z80
        nombre_archivo = f"{nombre}.asm"
        
        # Construye la ruta completa donde se guardará el archivo
        ruta_archivo = os.path.join(settings.MEDIA_ROOT, 'z80_files', nombre_archivo)
        
        # Crea el archivo vacío
        try:
            os.makedirs(os.path.dirname(ruta_archivo), exist_ok=True)  # Crea el directorio si no existe
            with open(ruta_archivo, 'w') as archivo:
                pass  # Crea un archivo vacío
            
            # Guarda el archivo en el modelo
            instancia = ARCHIVO(nombre=nombre,usuario = request.user ,archivo_z80=f'z80_files/{nombre_archivo}')
            instancia.save()
            
            return JsonResponse({'mensaje': 'Archivo creado exitosamente.', "instancia":instancia.id})
        except Exception as e:
            return JsonResponse({'error': f'Error al crear el archivo: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Método no permitido.'}, status=405)


###### Vista para obtener el contenido de un archivo #####
def obtener_contenido_archivo(request, archivo_id):
    try:
        archivo_obj = ARCHIVO.objects.get(id=archivo_id)
        with archivo_obj.archivo_z80.open('r') as f:
            contenido = f.read()
        request.session['idArchivo'] = archivo_obj.id
        return JsonResponse({'contenido': contenido})
    except ARCHIVO.DoesNotExist:
        return JsonResponse({'error': 'Archivo no encontrado.'}, status=404)
    

###### Vista para importar archivos #####
@csrf_exempt  # Eliminar esta línea si tienes configurado correctamente CSRF en el frontend
def cargar_archivo(request):
    if request.method == 'POST' and request.FILES.get('archivo_z80'):
        archivo_subido = request.FILES['archivo_z80']

        nombre_sin_extension, _ = os.path.splitext(archivo_subido.name)

        # Crear el objeto en la base de datos
        nuevo_archivo = ARCHIVO(
            nombre=nombre_sin_extension,
            usuario=request.user,  # Puedes asignar el usuario actual si es necesario
            archivo_z80=archivo_subido
        )
        nuevo_archivo.save()

        return JsonResponse({'mensaje': 'Archivo cargado exitosamente', 'nombre_archivo': nuevo_archivo.nombre, "instancia":nuevo_archivo.id})
    
    return JsonResponse({'error': 'No se ha subido ningún archivo'}, status=400)


###### Vista para guardar un archivo #####
@csrf_exempt
def guardar_archivo_editado(request):
    if request.method == 'POST':
        archivo_id = request.session['idArchivo']  # Usamos el ID de archivo almacenado en la sesión

        # Verificar que el archivo_id sea válido
        try:
            archivo_obj = ARCHIVO.objects.get(id=archivo_id)
        except ARCHIVO.DoesNotExist:
            return JsonResponse({'error': 'Archivo no encontrado.'}, status=404)

        contenido = request.POST.get('contenido', '')  # Contenido editado del archivo

        # Verificar si el contenido está vacío
        if not contenido:
            return JsonResponse({'error': 'El contenido del archivo está vacío'}, status=400)

        # Crear un archivo en memoria con el contenido editado
        contenido_en_memoria = ContentFile(contenido.encode('utf-8'))

        # Obtener el nombre original del archivo con su extensión .asm
        nombre_archivo_original = archivo_obj.nombre + ".asm"

        # Eliminar el archivo actual (si existe) antes de guardar el nuevo
        archivo_obj.archivo_z80.delete(save=False)

        # Guardar el nuevo archivo sobreescribiendo el anterior
        archivo_obj.archivo_z80.save(nombre_archivo_original, contenido_en_memoria, save=True)

        return JsonResponse({
            'mensaje': 'Archivo sobrescrito exitosamente',
            'nombre_archivo': archivo_obj.nombre
        })

    return JsonResponse({'error': 'Método no permitido'}, status=405)




###### Vista para eliminar un archivo #####
@csrf_exempt
def eliminar_archivo(request):
    if request.method == 'POST':
        archivo_id = request.session['idArchivo'] # Obtener el ID del archivo de la sesión

        if not archivo_id:
            return JsonResponse({'error': 'No hay archivo para eliminar en la sesión.'}, status=400)

        try:
            archivo_obj = ARCHIVO.objects.get(id=archivo_id)  # Buscar el archivo en la base de datos
        except ARCHIVO.DoesNotExist:
            return JsonResponse({'error': 'Archivo no encontrado.'}, status=404)

        # Eliminar el archivo físico del almacenamiento
        archivo_obj.archivo_z80.delete()  # Esto eliminará el archivo físicamente

        # Eliminar la entrada en la base de datos
        archivo_obj.delete()

        # Limpiar la sesión (opcional)
        del request.session['idArchivo']

        return JsonResponse({'mensaje': 'Archivo eliminado exitosamente.'})

    return JsonResponse({'error': 'Método no permitido'}, status=405)