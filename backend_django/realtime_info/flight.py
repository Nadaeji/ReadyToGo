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
        self.browser = None
        self.context = None
        self.page = None

    async def setup_browser(self, headless=True):
        """브라우저 초기화"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
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

async def crawl_single_destination(departure='ICN', arrival='NRT', date=None):
    """특정 목적지 상세 크롤링"""
    crawler = ImprovedFlightCrawler()
    await crawler.setup_browser(headless=True)
    
    try:
        flights = await crawler.crawl_naver_flights(departure, arrival, date)
        
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