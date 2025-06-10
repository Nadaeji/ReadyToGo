// Exchange module
const ExchangeModule = {
  elements: {
    fromCurrency: document.getElementById("fromCurrency"),
    toCurrency: document.getElementById("toCurrency"),
    exchangeAmount: document.getElementById("exchangeAmount"),
    getExchangeBtn: document.getElementById("getExchangeBtn"),
    exchangeResult: document.getElementById("exchangeResult"),
    conversionText: document.getElementById("conversionText"),
    rateText: document.getElementById("rateText"),
    changeIcon: document.getElementById("changeIcon"),
    changeText: document.getElementById("changeText"),
    updateTime: document.getElementById("updateTime"),
    popularRatesContainer: document.getElementById("popularRatesContainer"),
  },
}

function initExchange() {
  setupExchangeEventListeners()
  loadPopularRates()
}

function setupExchangeEventListeners() {
  ExchangeModule.elements.getExchangeBtn.addEventListener("click", getExchangeRate)
  
  // 엔터키 입력 시 환율 조회
  ExchangeModule.elements.exchangeAmount.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getExchangeRate()
    }
  })

  // 통화 변경 시 자동 조회
  ExchangeModule.elements.fromCurrency.addEventListener("change", getExchangeRate)
  ExchangeModule.elements.toCurrency.addEventListener("change", getExchangeRate)
}

async function getExchangeRate() {
  const fromCurrency = ExchangeModule.elements.fromCurrency.value
  const toCurrency = ExchangeModule.elements.toCurrency.value
  const amount = parseFloat(ExchangeModule.elements.exchangeAmount.value) || 1

  if (!fromCurrency || !toCurrency) {
    showNotification('기준 통화와 대상 통화를 선택해주세요.', 'warning');
    return;
  }

  setLoadingState(ExchangeModule.elements.getExchangeBtn, true)

  try {
    const params = {
      base: fromCurrency,
      targets: toCurrency
    };

    const exchangeData = await apiGet(API_CONFIG.ENDPOINTS.EXCHANGE_RATES, params);
    
    // API 응답 데이터 구조에 맞게 처리
    const rate = extractExchangeRate(exchangeData, fromCurrency, toCurrency);
    const convertedAmount = (amount * rate).toFixed(2);
    
    const displayData = {
      from: fromCurrency,
      to: toCurrency,
      rate: rate,
      amount: amount,
      convertedAmount: convertedAmount,
      change: exchangeData.change || (Math.random() - 0.5) * 10, // Mock change if not provided
      lastUpdated: exchangeData.last_updated || new Date().toLocaleTimeString('ko-KR'),
    };

    displayExchangeData(displayData);
    
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    handleApiError(error, "환율 정보를 가져오는데 실패했습니다.");
  } finally {
    setLoadingState(ExchangeModule.elements.getExchangeBtn, false);
  }
}

function extractExchangeRate(data, fromCurrency, toCurrency) {
  // API 응답 구조에 따라 환율 추출
  if (data.rates && data.rates[toCurrency]) {
    return data.rates[toCurrency];
  } else if (data.rate) {
    return data.rate;
  } else if (data[toCurrency]) {
    return data[toCurrency];
  } else {
    // Fallback: Mock rate
    return generateMockRate(fromCurrency, toCurrency);
  }
}

function generateMockRate(fromCurrency, toCurrency) {
  // 실제 환율에 가까운 Mock 데이터 생성
  const rates = {
    'USD-KRW': 1320,
    'EUR-KRW': 1440,
    'JPY-KRW': 8.8,
    'GBP-KRW': 1650,
    'USD-JPY': 150,
    'EUR-USD': 1.09,
    'GBP-USD': 1.25,
  };
  
  const pair = `${fromCurrency}-${toCurrency}`;
  const reversePair = `${toCurrency}-${fromCurrency}`;
  
  if (rates[pair]) {
    return rates[pair];
  } else if (rates[reversePair]) {
    return 1 / rates[reversePair];
  } else {
    return Math.random() * 1000 + 100; // Random fallback
  }
}

function displayExchangeData(data) {
  ExchangeModule.elements.conversionText.textContent = 
    `${data.amount} ${data.from} = ${data.convertedAmount} ${data.to}`;

  ExchangeModule.elements.rateText.textContent = 
    `1 ${data.from} = ${data.rate.toFixed(4)} ${data.to}`;

  // Display change indicator
  const isPositive = data.change > 0;
  ExchangeModule.elements.changeIcon.className = 
    `fas fa-trending-${isPositive ? "up" : "down"}`;
  ExchangeModule.elements.changeIcon.style.color = isPositive ? "#10b981" : "#ef4444";

  ExchangeModule.elements.changeText.textContent = 
    `${isPositive ? "+" : ""}${data.change.toFixed(2)}%`;
  ExchangeModule.elements.changeText.style.color = isPositive ? "#10b981" : "#ef4444";

  ExchangeModule.elements.updateTime.textContent = `• 업데이트: ${data.lastUpdated}`;

  ExchangeModule.elements.exchangeResult.style.display = "block";
}

async function loadPopularRates() {
  try {
    // 주요 통화들의 환율 정보 가져오기
    const popularCurrencies = ['USD', 'EUR', 'JPY', 'GBP'];
    const baseCurrency = 'KRW';
    
    const params = {
      base: baseCurrency,
      targets: popularCurrencies.join(',')
    };

    const ratesData = await apiGet(API_CONFIG.ENDPOINTS.EXCHANGE_RATES, params);
    displayPopularRates(ratesData, baseCurrency, popularCurrencies);
    
  } catch (error) {
    console.error("Failed to load popular rates:", error);
    // Fallback to mock data
    displayMockPopularRates();
  }
}

function displayPopularRates(data, baseCurrency, currencies) {
  ExchangeModule.elements.popularRatesContainer.innerHTML = "";

  currencies.forEach(currency => {
    const rate = extractExchangeRate(data, baseCurrency, currency);
    const change = (Math.random() - 0.5) * 5; // Mock change
    const lastUpdated = data.last_updated || new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const rateItem = document.createElement("div");
    rateItem.className = "rate-item";

    const isPositive = change > 0;
    rateItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="rate-pair">${baseCurrency}/${currency}</div>
          <div class="rate-updated">${lastUpdated}</div>
        </div>
        <div style="text-align: right;">
          <div class="rate-value">${rate.toFixed(4)}</div>
          <div style="display: flex; align-items: center; gap: 0.25rem; color: ${isPositive ? "#10b981" : "#ef4444"};">
            <i class="fas fa-trending-${isPositive ? "up" : "down"}" style="font-size: 0.75rem;"></i>
            <span class="rate-change">${isPositive ? "+" : ""}${change.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;

    // 클릭 시 해당 통화로 설정
    rateItem.addEventListener('click', () => {
      ExchangeModule.elements.fromCurrency.value = baseCurrency;
      ExchangeModule.elements.toCurrency.value = currency;
      getExchangeRate();
    });

    ExchangeModule.elements.popularRatesContainer.appendChild(rateItem);
  });
}

function displayMockPopularRates() {
  const mockRates = [
    { from: "KRW", to: "USD", rate: 0.000756, change: 2.3, lastUpdated: "10:30" },
    { from: "KRW", to: "EUR", rate: 0.000694, change: -0.5, lastUpdated: "10:30" },
    { from: "KRW", to: "JPY", rate: 0.1134, change: 1.2, lastUpdated: "10:30" },
    { from: "KRW", to: "GBP", rate: 0.000605, change: -0.8, lastUpdated: "10:30" },
  ];

  ExchangeModule.elements.popularRatesContainer.innerHTML = "";

  mockRates.forEach((rate) => {
    const rateItem = document.createElement("div");
    rateItem.className = "rate-item";

    const isPositive = rate.change > 0;
    rateItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="rate-pair">${rate.from}/${rate.to}</div>
          <div class="rate-updated">${rate.lastUpdated}</div>
        </div>
        <div style="text-align: right;">
          <div class="rate-value">${rate.rate.toFixed(6)}</div>
          <div style="display: flex; align-items: center; gap: 0.25rem; color: ${isPositive ? "#10b981" : "#ef4444"};">
            <i class="fas fa-trending-${isPositive ? "up" : "down"}" style="font-size: 0.75rem;"></i>
            <span class="rate-change">${isPositive ? "+" : ""}${rate.change.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;

    // 클릭 시 해당 통화로 설정
    rateItem.addEventListener('click', () => {
      ExchangeModule.elements.fromCurrency.value = rate.from;
      ExchangeModule.elements.toCurrency.value = rate.to;
      getExchangeRate();
    });

    ExchangeModule.elements.popularRatesContainer.appendChild(rateItem);
  });
}
