import asyncio
import json
import re
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import pandas as pd
import time

class ImprovedFlightCrawler:
    def __init__(self):
        # 주요 항공 사이트들
        self.sites = {
            'skyscanner': 'https://www.skyscanner.co.kr',
            'naver': 'https://flight.naver.com',
            'kayak': 'https://www.kayak.co.kr'
        }
        
        # 인기 목적지 공항 코드
        self.destinations = {
            '일본': {
                'NRT': '도쿄(나리타)', 'HND': '도쿄(하네다)', 
                'KIX': '오사카', 'NGO': '나고야', 'CTS': '삿포로'
            },
            '동남아': {
                'SIN': '싱가포르', 'BKK': '방콕', 'KUL': '쿠알라룸푸르',
                'MNL': '마닐라', 'HAN': '하노이', 'SGN': '호치민'
            },
            '유럽': {
                'LHR': '런던', 'CDG': '파리', 'FRA': '프랑크푸르트',
                'FCO': '로마', 'VIE': '비엔나', 'AMS': '암스테르담'
            },
            '미주': {
                'LAX': '로스앤젤레스', 'JFK': '뉴욕', 'SFO': '샌프란시스코',
                'SEA': '시애틀', 'YVR': '밴쿠버', 'YYZ': '토론토'
            }
        }
        
        self.browser = None
        self.context = None
        self.page = None

    async def setup_browser(self, headless=True):
        """브라우저 초기화"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=[
                '--no-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]
        )
        
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        self.page = await self.context.new_page()
        
        # 자동화 감지 방지
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)

    async def close_browser(self):
        """브라우저 정리"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def crawl_naver_flights(self, departure='ICN', arrival='NRT', date=None):
        """네이버 항공 크롤링 (개선된 버전)"""
        if not date:
            date = (datetime.now() + timedelta(days=30)).strftime('%Y%m%d')
        
        url = f"https://flight.naver.com/flights/international/{departure}-{arrival}-{date}?adult=1&fareType=Y"
        
        try:
            print(f"🔍 네이버 항공 검색: {departure} → {arrival} ({date})")
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # 검색 결과 로딩 대기
            await self.page.wait_for_timeout(5000)
            
            # 더 많은 결과 로드 (스크롤)
            for _ in range(3):
                await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await self.page.wait_for_timeout(2000)
            
            flights = await self.extract_naver_flights()
            print(f"✅ {len(flights)}개 항공편 발견")
            
            return flights
            
        except Exception as e:
            print(f"❌ 네이버 크롤링 오류: {e}")
            return []

    async def extract_naver_flights(self):
        """네이버 항공편 데이터 추출 (개선된 셀렉터)"""
        flights = []
        
        # 다양한 셀렉터 시도
        selectors = [
            '[class*="indivisual_IndivisualItem__CVm69 indivisual_with_labels__vj6Hn"]'
        ]
        
        flight_items = []
        for selector in selectors:
            try:
                items = await self.page.query_selector_all(selector)
                if items:
                    flight_items = items
                    print(f"셀렉터 성공: {selector} - {len(items)}개 발견")
                    break
            except:
                continue
        
        if not flight_items:
            print("항공편 아이템을 찾을 수 없습니다.")
            return flights
        
        for i, item in enumerate(flight_items[:5]):  # 최대 10개
            try:
                flight_data = await self.extract_flight_info(item, i+1)
                if flight_data:
                    flights.append(flight_data)
                    
            except Exception as e:
                print(f"항목 {i+1} 추출 오류: {e}")
                continue
        
        return flights

    async def extract_flight_info(self, item, index):
        """개별 항공편 정보 추출"""
        try:
            # 항공사명
            airline = await self.get_text_by_selectors(item, [
                '[class*="airline_name__0Tw5w"]'
            ])
            
            # 가격
            price = await self.get_text_by_selectors(item, [
                '[class*="item_num__aKbk4"]'
            ])
            
            # 출발시간
            departure_time = await self.get_text_by_selectors(item, [
                '[class*="route_time__xWu7a"]'
            ])
            
            # 소요시간
            duration = await self.get_text_by_selectors(item, [
                '[class*="route_details__F_ShG"]'
            ])
            
            
            if price and ('원' in price or any(char.isdigit() for char in price)):
                return {
                    'index': index,
                    'airline': airline or '정보없음',
                    'price': self.clean_price(price),
                    'price_numeric': self.extract_price_number(price),
                    'departure_time': departure_time or '정보없음',
                    'duration': duration or '정보없음',
                    'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': 'naver'
                }
                
        except Exception as e:
            print(f"항공편 정보 추출 오류: {e}")
            
        return None

    async def get_text_by_selectors(self, element, selectors):
        """여러 셀렉터로 텍스트 추출 시도"""
        for selector in selectors:
            try:
                elem = await element.query_selector(selector)
                if elem:
                    text = await elem.inner_text()
                    if text and text.strip():
                        return text.strip()
            except:
                continue
        return None

    def clean_price(self, price_str):
        """가격 문자열 정리"""
        if not price_str:
            return "정보없음"
        
        # 불필요한 문자 제거 후 포맷팅
        cleaned = re.sub(r'[^\d,원]', '', price_str)
        return cleaned if cleaned else price_str

    def extract_price_number(self, price_str):
        """가격에서 숫자만 추출"""
        if not price_str:
            return 0
        
        numbers = re.findall(r'\d+', price_str.replace(',', ''))
        if numbers:
            return int(''.join(numbers))
        return 0

    async def crawl_multiple_destinations(self, destinations_dict, departure='ICN'):
        """여러 목적지 크롤링"""
        all_results = {}
        
        await self.setup_browser(headless=False)  # 브라우저 보기
        
        try:
            for region, airports in destinations_dict.items():
                print(f"\n🌍 {region} 지역 검색 시작")
                all_results[region] = {}
                
                for code, city in airports.items():
                    try:
                        flights = await self.crawl_naver_flights(departure, code)
                        
                        if flights:
                            prices = [f['price_numeric'] for f in flights if f['price_numeric'] > 0]
                            min_price = min(prices) if prices else 0
                            
                            all_results[region][code] = {
                                'city': city,
                                'airport_code': code,
                                'flights': flights,
                                'flight_count': len(flights),
                                'min_price': min_price,
                                'min_price_formatted': f"{min_price:,}원" if min_price > 0 else "정보없음"
                            }
                            
                            print(f"  ✈️  {city} ({code}): {len(flights)}개 항공편, 최저 {min_price:,}원")
                        else:
                            print(f"  ❌ {city} ({code}): 검색 결과 없음")
                            
                        # 다음 검색을 위한 대기
                        await self.page.wait_for_timeout(3000)
                        
                    except Exception as e:
                        print(f"  ❌ {city} ({code}) 검색 실패: {e}")
                        continue
                        
        finally:
            await self.close_browser()
            
        return all_results

    def save_results(self, results, filename='flight_results'):
        """결과를 파일로 저장"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # JSON 저장
        json_file = f"{filename}_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        # Excel 저장
        excel_data = []
        for region, airports in results.items():
            for code, data in airports.items():
                for flight in data.get('flights', []):
                    excel_data.append({
                        '지역': region,
                        '도시': data['city'],
                        '공항코드': code,
                        '항공사': flight['airline'],
                        '가격': flight['price'],
                        '가격(숫자)': flight['price_numeric'],
                        '출발시간': flight['departure_time'],
                        '소요시간': flight['duration'],
                        '크롤링시간': flight['crawled_at']
                    })
        
        if excel_data:
            df = pd.DataFrame(excel_data)
            excel_file = f"{filename}_{timestamp}.xlsx"
            df.to_excel(excel_file, index=False)
            print(f"\n💾 결과 저장: {json_file}, {excel_file}")

    def print_summary(self, results):
        """결과 요약 출력"""
        print("\n" + "="*80)
        print("🛫 항공권 크롤링 결과 요약")
        print("="*80)
        
        all_flights = []
        
        for region, airports in results.items():
            print(f"\n🌍 【 {region} 】")
            
            region_flights = []
            for code, data in airports.items():
                if data.get('flights'):
                    min_price = data['min_price']
                    flight_count = data['flight_count']
                    
                    print(f"  ✈️  {data['city']:15} ({code}) : {flight_count:2d}개 항공편, 최저 {min_price:,}원")
                    
                    region_flights.append({
                        'region': region,
                        'city': data['city'],
                        'code': code,
                        'min_price': min_price,
                        'flight_count': flight_count
                    })
            
            all_flights.extend(region_flights)
        
        # 전체 최저가 TOP 10
        if all_flights:
            sorted_flights = sorted([f for f in all_flights if f['min_price'] > 0], 
                                  key=lambda x: x['min_price'])
            
            print(f"\n🏆 전체 최저가 TOP 10")
            print("-" * 50)
            for i, flight in enumerate(sorted_flights[:10], 1):
                print(f"{i:2d}. {flight['city']:15} : {flight['min_price']:>8,}원")

# 실행 함수들
async def crawl_popular_destinations():
    """인기 목적지 크롤링"""
    crawler = ImprovedFlightCrawler()
    
    # 선별된 인기 목적지만 크롤링
    selected_destinations = {
        '일본': {'NRT': '도쿄(나리타)'},
        # '동남아': {'SIN': '싱가포르', 'BKK': '방콕'},
        # '유럽': {'LHR': '런던', 'CDG': '파리'}
    }
    
    print("🚀 인기 목적지 항공권 가격 검색 시작...")
    results = await crawler.crawl_multiple_destinations(selected_destinations)
    print(results)
    return results

async def crawl_single_destination(departure='ICN', arrival='NRT'):
    """특정 목적지 상세 크롤링"""
    crawler = ImprovedFlightCrawler()
    await crawler.setup_browser(headless=False)
    
    try:
        flights = await crawler.crawl_naver_flights(departure, arrival)
        
        if flights:
            print(f"\n📊 {departure} → {arrival} 검색 결과:")
            print("-" * 60)
            
            for flight in flights:
                print(f"{flight['index']:2d}. {flight['airline']:15} "
                      f"{flight['price']:>12} "
                      f"{flight['departure_time']} → {flight['arrival_time']} "
                      f"({flight['duration']})")
            
            # 최저가 찾기
            valid_prices = [f['price_numeric'] for f in flights if f['price_numeric'] > 0]
            if valid_prices:
                min_price = min(valid_prices)
                cheapest = next(f for f in flights if f['price_numeric'] == min_price)
                print(f"\n🏆 최저가: {cheapest['airline']} - {min_price:,}원")
        
        return flights
        
    finally:
        await crawler.close_browser()

# 메인 실행 함수
if __name__ == "__main__":
    print("🛫 항공권 크롤링 시스템")
    print("="*50)
    print()
    
    # 예시 실행
    asyncio.run(crawl_popular_destinations())