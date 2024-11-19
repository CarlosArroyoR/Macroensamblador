from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import handler404
# from LataApp.views import page_not_found_404


# handler404 = page_not_found_404

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('aplicacion.urls')),
    path('autenticacion/', include('autenticacion.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
