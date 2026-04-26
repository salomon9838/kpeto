# pharmacie/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet
from . import views

router = DefaultRouter()
router.register(r'messages', ConversationViewSet, basename='pharmacie-messages')

urlpatterns = [
     path('stats/', views.dashboard_stats, name='pharmacie-stats'),
    path('medicines/', views.medicines_list, name='pharmacie-medicines'),
    path('medicines/<int:pk>/update_stock/', views.update_medicine_stock, name='pharmacie-update-stock'),
    path('orders/', views.orders_list, name='pharmacie-orders'),
    path('orders/<int:pk>/update_status/', views.update_order_status, name='pharmacie-update-order'),
    path('sales/', views.sales_data, name='pharmacie-sales'),
    path('', include(router.urls)),
]