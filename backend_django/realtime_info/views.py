import logging
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import RealtimeDataService

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_exchange_rates(request):
    """실시간 환율 정보 조회"""
    try:
        base_currency = request.GET.get('base', 'KRW')
        target_currencies = request.GET.get('targets', 'USD,JPY,EUR,GBP,CAD,AUD,CNY').split(',')
        target_currencies = [currency.strip() for currency in target_currencies]
        
        # 실시간 API에서 데이터 가져오기
        service = RealtimeDataService()
        exchange_data = service.get_realtime_exchange_rates(
            base_currency=base_currency,
            target_currencies=target_currencies
        )
        
        return Response(exchange_data)
        
    except Exception as e:
        logger.error(f"환율 정보 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch exchange rates'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_weather_info(request):
    """실시간 날씨 정보 조회"""
    try:
        country = request.GET.get('country')
        city = request.GET.get('city')
        
        if not country:
            return Response(
                {'error': 'country parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 실시간 API에서 데이터 가져오기
        service = RealtimeDataService()
        weather_data = service.get_realtime_weather(country=country, city=city)
        
        return Response(weather_data)
        
    except Exception as e:
        logger.error(f"날씨 정보 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch weather info'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_flight_trends(request):
    """항공료 트렌드 정보 조회"""
    try:
        origin = request.GET.get('origin', 'ICN')
        destination = request.GET.get('destination', 'LAX')
        date = request.GET.get('date', '20250618')
        
        # 실시간 데이터 서비스에서 항공료 정보 가져오기
        service = RealtimeDataService()
        flight_data = service.get_flight_price_trends(origin, destination, date)
        
        return Response(flight_data)
        
    except Exception as e:
        logger.error(f"항공료 트렌드 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch flight trends'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_flight_price_trends(request):
    """항공료 가격 트렌드 정보 조회 (실제 크롤링)"""
    try:
        origin = request.GET.get('origin', 'ICN')
        destination = request.GET.get('destination', 'NRT')
        date = request.GET.get('date')
        if "-" in date:
            date = date.replace("-", "")
          
        # 실시간 데이터 서비스에서 항공료 정보 가져오기
        service = RealtimeDataService()
        flight_data = service.get_flight_price_trends(origin, destination, date)
        
        return Response(flight_data)
        
    except Exception as e:
        logger.error(f"항공료 가격 트렌드 조회 실패: {e}")
        return Response(
            {'error': 'Failed to fetch flight price trends'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )