import requests
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

class RealtimeDataService:
    """실시간 데이터 수집 서비스"""
    
    def __init__(self):
        # API 키들 (환경변수에서 가져오기)
        self.fixer_api_key = getattr(settings, 'FIXER_API_KEY', None)
        self.openweather_api_key = getattr(settings, 'OPENWEATHER_API_KEY', None)

    def get_realtime_exchange_rates(self, base_currency='KRW', target_currencies=None):
        """실시간 환율 정보 조회"""
        if target_currencies is None:
            target_currencies = ['USD', 'JPY', 'EUR', 'GBP']
            
        try:
            url = "https://api.exchangerate-api.com/v4/latest/KRW"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', {})
                
                result = {}
                for currency in target_currencies:
                    if currency in rates:
                        result[currency] = {
                            'rate': 1 / rates[currency] if rates[currency] != 0 else 0,
                            'updated': timezone.now().isoformat()
                        }
                    else:
                        result[currency] = {
                            'rate': None,
                            'error': 'Rate not available'
                        }
                        
                return {
                    'base_currency': base_currency,
                    'rates': result,
                    'source': 'exchangerate-api.com'
                }
            else:
                raise Exception(f"API 응답 오류: {response.status_code}")
                
        except Exception as e:
            logger.error(f"실시간 환율 조회 실패: {e}")
            return {
                'base_currency': base_currency,
                'rates': {currency: {'rate': None, 'error': 'API 호출 실패'} for currency in target_currencies},
                'error': str(e)
            }
    
    def get_realtime_weather(self, country, city=None):
        """실시간 날씨 정보 조회"""
        try:
            if not self.openweather_api_key:
                return {'error': 'OpenWeather API 키가 설정되지 않았습니다'}
            
            # 단일 도시 조회
            if city:
                cities = [city]
            else:
                # 국가별 주요 도시 목록 (확장 가능)
                major_cities = {
                    'America': ['New York', 'Los Angeles', 'Chicago'],
                    'Japan': ['Tokyo', 'Osaka', 'Kyoto'],
                    'China': ['Beijing', 'Shanghai', 'Guangzhou'],
                    'Thailand': ['Bangkok', 'Phuket', 'Chiang Mai']
                }
                cities = major_cities.get(country, [country])
            
            weather_data = []
            
            for city_name in cities:
                try:
                    url = f"http://api.openweathermap.org/data/2.5/weather"
                    params = {
                        'q': f"{city_name},{country}",
                        'appid': self.openweather_api_key,
                        'units': 'metric',
                        'lang': 'kr'
                    }
                    
                    response = requests.get(url, params=params, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        
                        weather_data.append({
                            'country': country,
                            'city': city_name,
                            'temperature': data['main']['temp'],
                            'condition': data['weather'][0]['main'],
                            'humidity': data['main']['humidity'],
                            'description': data['weather'][0]['description'],
                            'updated': timezone.now().isoformat()
                        })
                        
                except Exception as e:
                    logger.error(f"날씨 정보 조회 실패 {city_name}: {e}")
                    continue
            
            return {'weather_info': weather_data}
            
        except Exception as e:
            logger.error(f"실시간 날씨 조회 실패: {e}")
            return {'error': str(e)}

    def get_flight_price_trends(self, origin='ICN', destination='LAX'):
        """항공료 트렌드 정보 (실제 API 호출)"""
        try:
            # RapidAPI 키 설정 (settings.py에 추가 필요)
            rapidapi_key = getattr(settings, 'RAPIDAPI_KEY', None)
            
            if not rapidapi_key:
                logger.warning("RAPIDAPI_KEY가 설정되지 않았습니다. 샘플 데이터를 반환합니다.")
            
            # 현재 날짜와 6개월 후 날짜 계산 (가격 범위 조회용)
            today = datetime.now()
            six_months_later = today + timedelta(days=180)
            
            # 날짜 형식 변환 (YYYY-MM-DD)
            today_str = today.strftime("%Y-%m-%d")
            six_months_later_str = six_months_later.strftime("%Y-%m-%d")
            
            # RapidAPI Flight Price API 호출
            url = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browseroutes/v1.0/KR/KRW/ko-KR/{}/{}/{}".format(
                origin, destination, today_str
            )
            
            headers = {
                'x-rapidapi-host': "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
                'x-rapidapi-key': rapidapi_key
            }
            
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                quotes = data.get('Quotes', [])
                
                if not quotes:
                    logger.warning(f"No quotes found for {origin} to {destination}")
                    return self._get_sample_flight_price_trends(origin, destination)
                
                # 최저가, 최고가, 평균가 계산
                prices = [quote.get('MinPrice', 0) for quote in quotes]
                min_price = min(prices) if prices else 0
                max_price = max(prices) if prices else 0
                avg_price = sum(prices) / len(prices) if prices else 0
                
                # 가격 추세 결정 (최근 가격이 평균보다 높으면 증가, 낮으면 감소)
                current_price = prices[0] if prices else 0
                price_trend = 'increasing' if current_price > avg_price else 'decreasing' if current_price < avg_price else 'stable'
                
                # 최저가 월 찾기 (간단한 로직)
                best_month = (today.month + 1) % 12 or 12  # 다음 달 (0이면 12월로 변경)
                
                return {
                    'route': f"{origin} → {destination}",
                    'current_price': current_price,
                    'price_trend': price_trend,  # increasing, decreasing, stable
                    'best_month': f'{best_month}월',
                    'price_range': {
                        'min': min_price,
                        'max': max_price,
                        'average': int(avg_price)
                    },
                    'last_updated': timezone.now().isoformat()
                }
            else:
                logger.error(f"API 호출 실패: {response.status_code} - {response.text}")
                return self._get_sample_flight_price_trends(origin, destination)
                
        except Exception as e:
            logger.error(f"항공권 가격 조회 실패: {e}")
            return self._get_sample_flight_price_trends(origin, destination)
