from django.urls import path
from aplicacion import views
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import handler404


###### Enlace de las vistas #####
urlpatterns = [
    path('', views.home, name="Home"),
    path('guardar_archivo_nuevo/', views.guardar_archivo_nuevo, name='guardar_archivo_nuevo'),
    path('archivo/contenido/<int:archivo_id>/', views.obtener_contenido_archivo, name='obtener_contenido_archivo'),
    path('cargar_archivo/', views.cargar_archivo, name='cargar_archivo'),
    path('guardar_archivo_editado/', views.guardar_archivo_editado, name='guardar_archivo_editado'),
    path('eliminar_archivo/', views.eliminar_archivo, name='eliminar_archivo'),
]