from django.urls import path
from . import views

urlpatterns = [
    path('exchange-rates/', views.get_exchange_rates, name='exchange_rates'),
    path('weather/', views.get_weather_info, name='weather_info'),
    path('flight-trends/', views.get_flight_trends, name='flight_trends'),
    path('flight-price-trends/', views.get_flight_price_trends, name='flight_price_trends'),
]
