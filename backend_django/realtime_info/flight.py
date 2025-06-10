import asyncio
import json
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import pandas as pd
import time

class NaverFlightCrawler:
    def __init__(self):
        self.base_url = "https://flight.naver.com/flights/"
        self.countries = {
            'italy': ['FCO', 'MXP', 'NAP'],  # 로마, 밀라노, 나폴리
            'japan': ['NRT', 'HND', 'KIX', 'NGO'],  # 나리타, 하네다, 간사이, 중부
            'singapore': ['SIN'],  # 싱가포르
            'uk': ['LHR', 'LGW', 'STN'],  # 히드로, 개트윅, 스탠스테드
            'australia': ['SYD', 'MEL', 'BNE'],  # 시드니, 멜버른, 브리즈번
            'austria': ['VIE'],  # 비엔나
            'canada': ['YVR', 'YYZ'],  # 밴쿠버, 토론토
            'america': ['LAX', 'JFK', 'SFO', 'ORD'],  # LA, 뉴욕, 샌프란시스코, 시카고
            'china': ['PEK', 'PVG', 'CAN'],  # 베이징, 상하이, 광저우
            'france': ['CDG', 'ORY'],  # 샤를드골, 오를리
            'germany': ['FRA', 'MUC'],  # 프랑크푸르트, 뮌헨
            'newzealand': ['AKL', 'CHC']  # 오클랜드, 크라이스트처치
        }
        
        # 공항 코드별 도시명 매핑
        self.airport_cities = {
            'FCO': '로마', 'MXP': '밀라노', 'NAP': '나폴리',
            'NRT': '도쿄(나리타)', 'HND': '도쿄(하네다)', 'KIX': '오사카', 'NGO': '나고야',
            'SIN': '싱가포르',
            'LHR': '런던(히드로)', 'LGW': '런던(개트윅)', 'STN': '런던(스탠스테드)',
            'SYD': '시드니', 'MEL': '멜버른', 'BNE': '브리즈번',
            'VIE': '비엔나',
            'YVR': '밴쿠버', 'YYZ': '토론토',
            'LAX': '로스앤젤레스', 'JFK': '뉴욕', 'SFO': '샌프란시스코', 'ORD': '시카고',
            'PEK': '베이징', 'PVG': '상하이', 'CAN': '광저우',
            'CDG': '파리(샤를드골)', 'ORY': '파리(오를리)',
            'FRA': '프랑크푸르트', 'MUC': '뮌헨',
            'AKL': '오클랜드', 'CHC': '크라이스트처치'
        }
        
    async def setup_browser(self):
        """브라우저 초기화"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=False,  # 크롤링 과정을 보려면 False
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        self.page = await self.context.new_page()
        
    async def close_browser(self):
        """브라우저 정리"""
        await self.browser.close()
        await self.playwright.stop()
        
    async def search_flights(self, departure='ICN', arrival='NRT', date=None):
        """항공편 검색"""
        try:
            # 네이버 항공 사이트 접속
            await self.page.goto("https://flight.naver.com/flights/international/ICN-DAD-20250707?adult=1&isDirect=true&fareType=Y", wait_until='domcontentloaded')
            await self.page.wait_for_timeout(5000)  # 더 긴 대기시간
            
        except Exception as e:
            print(f"검색 중 오류 발생: {e}")
            return []
    
    async def extract_flight_data(self):
        """항공편 데이터 추출"""
        flights = []
        
        try:
            # 페이지 URL 확인 (검색 결과 페이지로 이동했는지 확인)
            current_url = self.page.url
            print(f"현재 페이지 URL: {current_url}")
            
            items = await self.page.query_selector_all('.indivisual_IndivisualItem__CVm69.indivisual_with_labels__vj6Hn')
            
            # 항공편 데이터 추출
            for i, item in enumerate(items[:3]):  # 최대 15개 결과만
                try:
                    # 항공사명 추출
                    airline_selectors = [
                        '[class*="airline"]', '[class*="company"]', '[class*="carrier"]',
                        '[class*="name"]', '.airline', '.company'
                    ]
                    airline = "정보없음"
                    for selector in airline_selectors:
                        try:
                            airline_elem = await item.query_selector(selector)
                            if airline_elem:
                                text = await airline_elem.inner_text()
                                if text and text.strip():
                                    airline = text.strip()
                                    break
                        except:
                            continue
                    
                    # 가격 추출 (가장 중요)
                    price_selectors = [
                        '[class*="price"]', '[class*="fare"]', '[class*="cost"]',
                        '[class*="amount"]', '.price', '.fare', '[class*="won"]'
                    ]
                    price = "정보없음"
                    for selector in price_selectors:
                        try:
                            price_elem = await item.query_selector(selector)
                            if price_elem:
                                text = await price_elem.inner_text()
                                if text and ('원' in text or ',' in text or text.isdigit()):
                                    price = text.strip()
                                    break
                        except:
                            continue
                    
                    # 시간 정보 추출
                    time_selectors = [
                        '[class*="time"]', '[class*="departure"]', '[class*="arrival"]',
                        '[class*="schedule"]', '.time', '.schedule'
                    ]
                    times = []
                    for selector in time_selectors:
                        try:
                            time_elems = await item.query_selector_all(selector)
                            for elem in time_elems[:2]:  # 출발/도착 시간만
                                text = await elem.inner_text()
                                if text and ':' in text:
                                    times.append(text.strip())
                        except:
                            continue
                    
                    dept_time = times[0] if len(times) > 0 else "정보없음"
                    arr_time = times[1] if len(times) > 1 else "정보없음"
                    
                    # 소요시간 추출
                    duration_selectors = [
                        '[class*="duration"]', '[class*="flight-time"]', '[class*="time"]:contains("시간")',
                        '[class*="elapsed"]'
                    ]
                    duration = "정보없음"
                    for selector in duration_selectors:
                        try:
                            duration_elem = await item.query_selector(selector)
                            if duration_elem:
                                text = await duration_elem.inner_text()
                                if text and ('시간' in text or 'h' in text):
                                    duration = text.strip()
                                    break
                        except:
                            continue
                    
                    # 데이터가 유효한 경우에만 추가
                    if price != "정보없음" or airline != "정보없음":
                        flights.append({
                            'airline': airline,
                            'price': price,
                            'departure_time': dept_time,
                            'arrival_time': arr_time,
                            'duration': duration,
                            'search_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        })
                        print(f"  항공편 {i+1}: {airline} - {price}")
                    
                except Exception as e:
                    print(f"항목 {i+1} 추출 중 오류: {e}")
                    continue
                    
        except Exception as e:
            print(f"데이터 추출 중 오류: {e}")
        
        print(f"총 {len(flights)}개의 항공편 데이터를 추출했습니다.")
        return flights
    
    async def crawl_all_countries(self):
        """모든 국가의 항공료 정보 수집"""
        all_results = {}
        
        await self.setup_browser()
        
        try:
            for country, airports in self.countries.items():
                print(f"\n=== {country.upper()} 검색 중 ===")
                all_results[country] = {}
                
                for airport in airports:
                    try:
                        print(f"  {self.airport_cities.get(airport, airport)} ({airport}) 검색...")
                        
                        # 각 공항별 검색
                        flights = await self.search_flights(departure='ICN', arrival=airport)
                        
                        if flights:
                            all_results[country][airport] = {
                                'city': self.airport_cities.get(airport, airport),
                                'flights': flights,
                                'min_price': min([self.extract_price(f['price']) for f in flights if self.extract_price(f['price']) > 0], default=0)
                            }
                            print(f"    결과: {len(flights)}개 항공편, 최저가: {all_results[country][airport]['min_price']:,}원")
                        else:
                            print(f"    결과 없음")
                            
                        # 다음 검색을 위한 대기
                        await self.page.wait_for_timeout(3000)
                        
                    except Exception as e:
                        print(f"  {airport} 검색 실패: {e}")
                        continue
                        
        finally:
            await self.close_browser()
            
        return all_results
    
    def extract_price(self, price_str):
        """가격 문자열에서 숫자만 추출"""
        try:
            import re
            price_num = re.sub(r'[^\d]', '', price_str)
            return int(price_num) if price_num else 0
        except:
            return 0

    def print_summary(self, results):
        """결과 요약 출력"""
        print("\n" + "="*60)
        print("네이버 항공료 크롤링 결과 요약")
        print("="*60)
        
        for country, airports in results.items():
            if airports:
                print(f"\n【 {country.upper()} 】")
                for airport, data in airports.items():
                    if 'min_price' in data and data['min_price'] > 0:
                        print(f"  {data['city']} ({airport}): {data['min_price']:,}원~")

# 실행 함수
async def main():
    """메인 실행 함수"""
    crawler = NaverFlightCrawler()
    
    print("🛫 네이버 항공료 실시간 크롤링을 시작합니다...")
    print("📍 대상 국가: italy, japan, singapore, uk, australia, austria, canada, america, china, france, germany, newzealand")
    print("⏱️  예상 소요시간: 약 30-60분 (네트워크 상황에 따라 달라질 수 있습니다)")
    print("-" * 70)
    
    # 모든 국가 크롤링 실행
    results = await crawler.crawl_all_countries()
    
    # 결과 저장 및 출력
    crawler.print_summary(results)
    
    print("\n✅ 크롤링 완료!")
    print("📁 결과 파일이 생성되었습니다 (JSON, Excel)")


# 단일 국가 크롤링 예제 (더 안정적)
async def crawl_single_country(country='japan'):
    """특정 국가만 크롤링하는 예제"""
    crawler = NaverFlightCrawler()
    await crawler.setup_browser()
    
    try:
        airports = crawler.countries.get(country, [])
        results = {}
        
        for airport in airports:
            print(f"검색 중: {crawler.airport_cities.get(airport, airport)} ({airport})")
            flights = await crawler.search_flights(arrival=airport)
            if flights:
                results[airport] = {
                    'city': crawler.airport_cities.get(airport, airport),
                    'flights': flights,
                    'min_price': min([crawler.extract_price(f['price']) for f in flights])
                }
                print(f"완료: {len(flights)}개 항공편 발견")
            else:
                print("결과 없음")
            
            # 대기시간
            await asyncio.sleep(3)
                
        return results
    finally:
        await crawler.close_browser()

# 실시간 가격 모니터링 예제 (개선된 버전)
async def monitor_prices(target_airports=['NRT', 'SIN'], interval_minutes=30):
    """지정된 공항들의 가격을 주기적으로 모니터링"""
    crawler = NaverFlightCrawler()
    
    while True:
        print(f"\n{'='*50}")
        print(f"가격 체크 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*50}")
        
        await crawler.setup_browser()
        try:
            for airport in target_airports:
                try:
                    city = crawler.airport_cities.get(airport, airport)
                    print(f"\n검색 중: {city} ({airport})")
                    
                    flights = await crawler.search_flights(arrival=airport)
                    if flights:
                        prices = [crawler.extract_price(f['price']) for f in flights if crawler.extract_price(f['price']) > 0]
                        if prices:
                            min_price = min(prices)
                            avg_price = sum(prices) // len(prices)
                            print(f"  최저가: {min_price:,}원")
                            print(f"  평균가: {avg_price:,}원")
                            print(f"  항공편: {len(flights)}개")
                        else:
                            print("  가격 정보 없음")
                    else:
                        print("  검색 결과 없음")
                        
                    await asyncio.sleep(5)  # 다음 검색 전 대기
                    
                except Exception as e:
                    print(f"  오류: {e}")
                    continue
                    
        except Exception as e:
            print(f"모니터링 중 오류: {e}")
        finally:
            await crawler.close_browser()
            
        print(f"\n다음 체크까지 {interval_minutes}분 대기...")
        await asyncio.sleep(interval_minutes * 60)

# 특정 목적지 최저가 찾기
async def find_cheapest_destination(countries=['japan', 'singapore', 'thailand']):
    """여러 국가 중 가장 저렴한 목적지 찾기"""
    crawler = NaverFlightCrawler()
    await crawler.setup_browser()
    
    all_prices = []
    
    try:
        for country in countries:
            airports = crawler.countries.get(country, [])
            for airport in airports:
                try:
                    flights = await crawler.search_flights(arrival=airport)
                    if flights:
                        prices = [crawler.extract_price(f['price']) for f in flights if crawler.extract_price(f['price']) > 0]
                        if prices:
                            min_price = min(prices)
                            all_prices.append({
                                'country': country,
                                'airport': airport,
                                'city': crawler.airport_cities.get(airport, airport),
                                'min_price': min_price
                            })
                    await asyncio.sleep(3)
                except Exception as e:
                    print(f"{airport} 검색 실패: {e}")
                    
        # 가격순 정렬
        all_prices.sort(key=lambda x: x['min_price'])
        
        print("\n🏆 최저가 순위:")
        for i, dest in enumerate(all_prices[:10], 1):
            print(f"{i:2d}. {dest['city']} ({dest['airport']}) - {dest['min_price']:,}원")
            
        return all_prices
        
    finally:
        await crawler.close_browser()
        
# 스크립트 실행 방법
if __name__ == "__main__":
    print("📦 필요한 패키지 설치:")
    print("   pip install playwright pandas openpyxl")
    print("   playwright install")
    print()
    print("🚀 크롤링 시작...")
    print()
    
    # 실행
    # asyncio.run(main())
    asyncio.run(crawl_single_country())
