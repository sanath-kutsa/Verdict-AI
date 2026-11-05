document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navItems = document.querySelectorAll('.nav-item');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeToggleWrap = document.querySelector('.theme-toggle-wrap');
  const demoLoginButton = document.querySelector('[data-demo-login]');
  const THEME_STORAGE_KEY = 'verdict-theme';
  const DEMO_MODE_KEY = 'verdict-demo-mode';
  const WATCHLIST_KEY = 'verdict-watchlist';
  const TRANSACTIONS_KEY = 'verdict-transactions';

  const setTheme = (theme) => {
    const isDarkTheme = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = isDarkTheme ? '#101820' : '#edf3f0';
    document.body.style.color = isDarkTheme ? '#e8f0ef' : '#1d302f';
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light';

    if (themeToggleWrap) {
      themeToggleWrap.dataset.theme = isDarkTheme ? 'dark' : 'light';
    }

    if (themeToggle) {
      themeToggle.classList.toggle('is-dark', isDarkTheme);
      themeToggle.setAttribute('aria-checked', String(isDarkTheme));
      themeToggle.setAttribute('aria-label', isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.setAttribute('title', isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode');
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  const setAuthMessage = (message, tone = 'info') => {
    const notice = document.querySelector('.auth-alert');
    if (!notice) return;
    notice.textContent = message;
    notice.dataset.tone = tone;
  };

  const goToDashboard = async (name) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      setAuthMessage('Please enter your name to continue.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/users/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create your demo profile.');

      localStorage.setItem(DEMO_MODE_KEY, 'true');
      localStorage.setItem('verdict-user-id', String(data.user.id));
      localStorage.setItem('verdict-user-name', data.user.name);
      window.location.href = '/dashboard';
    } catch (error) {
      setAuthMessage(error.message || 'Unable to connect to Verdict AI. Please try again.', 'warning');
    }
  };

  const initLoginPage = () => {
    const passwordInput = document.querySelector('[data-password-input]');
    const passwordToggle = document.querySelector('[data-password-toggle]');
    const signInForm = document.querySelector('.auth-form');
    const emailButton = document.querySelector('[data-email-signin]');
    const googleButton = document.querySelector('[data-provider="Google"]');
    const appleButton = document.querySelector('[data-provider="Apple"]');
    const demoButton = document.querySelector('[data-demo-login]');
    const authLinks = document.querySelectorAll('[data-auth-message]');

    if (passwordInput && passwordToggle) {
      passwordToggle.addEventListener('click', () => {
        const shouldShow = passwordInput.type === 'password';
        passwordInput.type = shouldShow ? 'text' : 'password';
        passwordToggle.textContent = shouldShow ? 'Hide' : 'Show';
        passwordToggle.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
      });
    }

    if (signInForm && emailButton) {
      signInForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const nameInput = signInForm.querySelector('input[name="name"]');
        goToDashboard(nameInput ? nameInput.value : '');
      });
    }

    if (googleButton) {
      googleButton.addEventListener('click', () => {
        setAuthMessage('Google authentication setup is pending. OAuth integration with a backend is required before this option works.', 'warning');
      });
    }

    if (appleButton) {
      appleButton.addEventListener('click', () => {
        setAuthMessage('Apple authentication setup is pending. OAuth integration with a backend is required before this option works.', 'warning');
      });
    }

    if (demoButton) {
      demoButton.addEventListener('click', () => {
        const nameInput = document.querySelector('.auth-form input[name="name"]');
        goToDashboard(nameInput ? nameInput.value : '');
      });
    }

    authLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const message = link.getAttribute('data-auth-message');
        if (!message) return;
        event.preventDefault();
        setAuthMessage(message, 'info');
      });
    });
  };

  const demoStocks = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      price: 2978.6,
      change: 1.4,
      marketCap: '?18.7T',
      sentiment: 'Quality leadership',
      overview: 'Reliance continues to scale across energy, retail, and digital services.',
      revenueGrowth: '+11.2% YoY',
      forwardPe: '23.8x',
      grossMargin: '43.1%',
      cashFlow: '?1.9L Cr',
      beta: '1.08',
      sharpe: '1.24',
      volatility: 'Moderate'
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      price: 3754.2,
      change: 2.2,
      marketCap: '?14.9T',
      sentiment: 'Stable earnings',
      overview: 'TCS benefits from strong digital transformation demand and broad client retention.',
      revenueGrowth: '+9.8% YoY',
      forwardPe: '29.4x',
      grossMargin: '55.7%',
      cashFlow: '?1.4L Cr',
      beta: '0.92',
      sharpe: '1.51',
      volatility: 'Low'
    },
    {
      symbol: 'INFY',
      name: 'Infosys',
      price: 1562.45,
      change: 1.1,
      marketCap: '?8.3T',
      sentiment: 'Steady outlook',
      overview: 'Infosys remains well positioned in enterprise modernization and AI-led services.',
      revenueGrowth: '+12.6% YoY',
      forwardPe: '26.7x',
      grossMargin: '46.3%',
      cashFlow: '?66K Cr',
      beta: '0.88',
      sharpe: '1.42',
      volatility: 'Low'
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      price: 1712.8,
      change: -0.7,
      marketCap: '?12.5T',
      sentiment: 'Defensive quality',
      overview: 'HDFC Bank remains resilient with strong deposit franchise and underwriting discipline.',
      revenueGrowth: '+13.4% YoY',
      forwardPe: '18.9x',
      grossMargin: '63.2%',
      cashFlow: '?1.1L Cr',
      beta: '0.96',
      sharpe: '1.18',
      volatility: 'Moderate'
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank',
      price: 1288.6,
      change: 1.9,
      marketCap: '?9.9T',
      sentiment: 'Momentum building',
      overview: 'ICICI Bank keeps improving scale in retail banking and digital lending.',
      revenueGrowth: '+15.1% YoY',
      forwardPe: '21.2x',
      grossMargin: '59.8%',
      cashFlow: '?92K Cr',
      beta: '1.04',
      sharpe: '1.36',
      volatility: 'Moderate'
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      price: 936.75,
      change: 1.8,
      marketCap: '?7.8T',
      sentiment: 'Recovery trend',
      overview: 'SBI benefits from credit growth and improving operating leverage in core banking.',
      revenueGrowth: '+14.8% YoY',
      forwardPe: '10.4x',
      grossMargin: '53.4%',
      cashFlow: '?1.6L Cr',
      beta: '1.12',
      sharpe: '1.27',
      volatility: 'Moderate'
    }
  ];

  const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

  const initUserBadge = () => {
    const name = localStorage.getItem('verdict-user-name');
    const userId = localStorage.getItem('verdict-user-id');
    const tools = document.querySelector('.topbar-tools');
    if (!name || !userId || !tools || tools.querySelector('.user-greeting')) return;

    const badge = document.createElement('div');
    badge.className = 'user-greeting';
    badge.textContent = name;
    badge.setAttribute('title', 'Signed in demo user');
    badge.style.cssText = 'padding:8px 12px;border:1px solid var(--line);border-radius:999px;color:var(--text);font-weight:600;font-size:.85rem;white-space:nowrap;';
    tools.prepend(badge);
  };

  const initCollectionPage = () => {
    const collectionList = document.getElementById('demo-collection-list');
    const collectionTitle = document.getElementById('collection-heading');
    const collectionSubtitle = document.getElementById('collection-subtitle');

    if (!collectionList) {
      return;
    }

    const watchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    const items = watchlist.length ? watchlist : ['RELIANCE', 'TCS', 'INFY'];
    const prices = demoStocks.filter((stock) => items.includes(stock.symbol));

    if (collectionTitle) {
      collectionTitle.textContent = document.body.dataset.page === 'portfolio' ? 'Portfolio snapshot' : 'Watchlist overview';
    }

    if (collectionSubtitle) {
      collectionSubtitle.textContent = document.body.dataset.page === 'portfolio'
        ? 'Simulated holdings and allocation in DEMO mode.'
        : 'Fictional names and prices tracked for demo review only.';
    }

    collectionList.innerHTML = prices.map((stock) => `
      <li class="watchlist-item">
        <div>
          <strong>${stock.symbol}</strong><br />
          <small>${stock.name}</small>
        </div>
        <div style="text-align: right;">
          <strong>${formatMoney(stock.price)}</strong><br />
          <small class="${stock.change >= 0 ? 'badge-up' : 'badge-down'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(1)}%</small>
        </div>
      </li>
    `).join('');
  };

  const initInvestPage = () => {
    const stockCards = document.getElementById('stock-cards');
    const gainersList = document.getElementById('gainers-list');
    const losersList = document.getElementById('losers-list');
    const watchlistList = document.getElementById('watchlist-list');
    const detailName = document.getElementById('detail-name');
    const detailPrice = document.getElementById('detail-price');
    const detailPill = document.getElementById('detail-pill');
    const detailOverview = document.getElementById('company-overview');
    const detailSentiment = document.getElementById('market-sentiment');
    const detailRevGrowth = document.getElementById('revenue-growth');
    const detailPe = document.getElementById('forward-pe');
    const detailMarketCap = document.getElementById('market-cap');
    const detailGrossMargin = document.getElementById('gross-margin');
    const detailCashFlow = document.getElementById('cash-flow');
    const detailBeta = document.getElementById('beta');
    const detailSharpe = document.getElementById('sharpe');
    const detailVolatility = document.getElementById('volatility');
    const tradeSymbol = document.getElementById('trade-symbol');
    const tradeQty = document.getElementById('trade-qty');
    const tradeSide = document.getElementById('trade-side');
    const orderValue = document.getElementById('est-order-value');
    const tradeForm = document.getElementById('trade-form');
    const confirmationBox = document.getElementById('trade-confirmation');
    const transactionList = document.getElementById('transaction-list');
    const addWatchlistBtn = document.getElementById('add-watchlist-btn');
    const stockSearch = document.getElementById('stock-search');

    if (!stockCards) {
      return;
    }

    const defaultWatchlist = ['RELIANCE', 'TCS', 'INFY'];
    const defaultTransactions = [];

    const getWatchlist = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        return saved.length ? saved : defaultWatchlist;
      } catch (error) {
        return defaultWatchlist;
      }
    };

    const saveWatchlist = (items) => localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));

    const getTransactions = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
        return saved;
      } catch (error) {
        return defaultTransactions;
      }
    };

    const saveTransactions = (items) => localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(items));

    const renderTransactions = () => {
      const transactions = getTransactions();
      if (!transactionList) return;
      if (!transactions.length) { transactionList.innerHTML = '<li class="transaction-item">No saved demo trades yet.</li>'; return; }
      transactionList.innerHTML = transactions.slice(0, 4).map((item) => `
        <li class="transaction-item">
          <div>
            <strong>${item.side} ${item.qty} ${item.symbol}</strong><br />
            <small>${item.date}</small>
          </div>
          <strong>${formatMoney(item.value)}</strong>
        </li>
      `).join('');
    };

    const updateOrderValue = () => {
      if (!tradeSymbol || !tradeQty || !orderValue) return;
      const symbol = tradeSymbol.value;
      const stock = demoStocks.find((item) => item.symbol === symbol) || demoStocks[0];
      const qty = Number(tradeQty.value) || 0;
      const total = stock.price * qty;
      orderValue.textContent = formatMoney(total);
    };

    const renderTradeOptions = () => {
      if (!tradeSymbol) return;
      tradeSymbol.innerHTML = demoStocks.map((stock) => `<option value="${stock.symbol}">${stock.symbol} · ${stock.name}</option>`).join('');
      tradeSymbol.value = 'RELIANCE';
      updateOrderValue();
    };

    const renderDetail = (symbol) => {
      const stock = demoStocks.find((item) => item.symbol === symbol) || demoStocks[0];
      if (!detailName) return;
      detailName.textContent = `${stock.name}`;
      detailPrice.textContent = formatMoney(stock.price);
      detailPill.textContent = `${stock.change > 0 ? '+' : ''}${stock.change.toFixed(1)}%`;
      detailPill.className = stock.change >= 0 ? 'badge-up' : 'badge-down';
      detailOverview.textContent = stock.overview;
      detailSentiment.textContent = stock.sentiment;
      detailRevGrowth.textContent = stock.revenueGrowth;
      detailPe.textContent = stock.forwardPe;
      detailMarketCap.textContent = stock.marketCap;
      detailGrossMargin.textContent = stock.grossMargin;
      detailCashFlow.textContent = stock.cashFlow;
      detailBeta.textContent = stock.beta;
      detailSharpe.textContent = stock.sharpe;
      detailVolatility.textContent = stock.volatility;

      const chartPath = document.getElementById('detail-line');
      const chartArea = document.getElementById('detail-area');
      const base = stock.change >= 0 ? 130 : 150;
      const pattern = `M0,${base} C80,${base - 8}, 120,${base - 18}, 180,${base - 28} C260,${base - 40}, 330,${base - 55}, 390,${base - 35} C470,${base - 20}, 540,${base - 75}, 610,${base - 42} C680,${base - 25}, 720,${base - 70}, 760,${base - 90}`;
      const areaPattern = `${pattern} L760,220 L0,220 Z`;
      if (chartPath) chartPath.setAttribute('d', pattern);
      if (chartArea) chartArea.setAttribute('d', areaPattern);
    };

    const renderWatchlist = () => {
      const items = getWatchlist();
      if (!watchlistList) return;
      watchlistList.innerHTML = items.map((symbol) => {
        const stock = demoStocks.find((item) => item.symbol === symbol) || demoStocks[0];
        return `
          <li class="watchlist-item">
            <div>
              <strong>${stock.symbol}</strong><br />
              <small>${stock.name}</small>
            </div>
            <div style="text-align: right;">
              <strong>${formatMoney(stock.price)}</strong><br />
              <small class="${stock.change >= 0 ? 'badge-up' : 'badge-down'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(1)}%</small>
            </div>
            <button type="button" data-remove-symbol="${stock.symbol}">Remove</button>
          </li>
        `;
      }).join('');

      watchlistList.querySelectorAll('[data-remove-symbol]').forEach((button) => {
        button.addEventListener('click', () => {
          const symbol = button.getAttribute('data-remove-symbol');
          const next = getWatchlist().filter((item) => item !== symbol);
          saveWatchlist(next);
          renderWatchlist();
        });
      });
    };

    const renderStockCards = () => {
      const query = (stockSearch && stockSearch.value || '').trim().toLowerCase();
      const filtered = demoStocks.filter((stock) => {
        return !query || `${stock.symbol} ${stock.name}`.toLowerCase().includes(query);
      });
      if (!stockCards) return;
      stockCards.innerHTML = filtered.map((stock) => `
        <button type="button" class="stock-card ${stock.symbol === 'RELIANCE' ? 'selected' : ''}" data-symbol="${stock.symbol}">
          <div class="stock-card-header">
            <div class="stock-card-symbol">
              <strong>${stock.symbol}</strong>
              <span>${stock.name}</span>
            </div>
            <span class="${stock.change >= 0 ? 'badge-up' : 'badge-down'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(1)}%</span>
          </div>
          <div class="stock-card-footer">
            <span class="stock-price">${formatMoney(stock.price)}</span>
          </div>
        </button>
      `).join('');

      stockCards.querySelectorAll('[data-symbol]').forEach((card) => {
        card.addEventListener('click', () => {
          const nextSymbol = card.getAttribute('data-symbol');
          if (tradeSymbol) tradeSymbol.value = nextSymbol;
          renderDetail(nextSymbol);
          updateOrderValue();
          const cards = stockCards.querySelectorAll('.stock-card');
          cards.forEach((item) => item.classList.toggle('selected', item.getAttribute('data-symbol') === nextSymbol));
        });
      });
    };

    const renderGainersLosers = () => {
      const gainers = [...demoStocks].sort((a, b) => b.change - a.change).slice(0, 3);
      const losers = [...demoStocks].sort((a, b) => a.change - b.change).slice(0, 3);
      if (gainersList) {
        gainersList.innerHTML = gainers.map((stock) => `<li><span>${stock.symbol}</span><strong class="badge-up">+${stock.change.toFixed(1)}%</strong></li>`).join('');
      }
      if (losersList) {
        losersList.innerHTML = losers.map((stock) => `<li><span>${stock.symbol}</span><strong class="badge-down">${stock.change.toFixed(1)}%</strong></li>`).join('');
      }
    };

    const handleTradeSubmit = (event) => {
      event.preventDefault();
      if (!tradeSymbol || !tradeQty || !confirmationBox) return;
      const symbol = tradeSymbol.value;
      const side = tradeSide.value;
      const qty = Number(tradeQty.value) || 0;
      const stock = demoStocks.find((item) => item.symbol === symbol) || demoStocks[0];
      const nextTransactions = getTransactions();
      nextTransactions.unshift({
        symbol,
        side: side.charAt(0).toUpperCase() + side.slice(1),
        qty,
        value: stock.price * qty,
        date: 'Now'
      });
      saveTransactions(nextTransactions.slice(0, 5));
      renderTransactions();
      confirmationBox.textContent = `Demo order placed: ${qty} shares of ${symbol}. No real broker was contacted and no funds were moved.`;
      confirmationBox.classList.add('visible');
    };

    if (stockSearch) {
      stockSearch.addEventListener('input', renderStockCards);
    }

    if (addWatchlistBtn) {
      addWatchlistBtn.addEventListener('click', () => {
        const symbol = tradeSymbol && tradeSymbol.value ? tradeSymbol.value : 'RELIANCE';
        const existing = getWatchlist();
        if (!existing.includes(symbol)) {
          saveWatchlist([...existing, symbol]);
        }
        renderWatchlist();
      });
    }

    if (tradeQty) {
      tradeQty.addEventListener('input', updateOrderValue);
    }
    if (tradeSymbol) {
      tradeSymbol.addEventListener('change', updateOrderValue);
    }
    if (tradeForm) {
      tradeForm.addEventListener('submit', handleTradeSubmit);
    }

    document.querySelectorAll('.range-row .range-btn').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.range-row .range-btn').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        const chartContainer = document.querySelector('.stock-chart-box[data-candlestick]');
        if (chartContainer) {
          chartContainer.setAttribute('data-range', button.getAttribute('data-range') || '1M');
          renderCandlestickChart(
            chartContainer,
            chartContainer.getAttribute('data-candlestick') || 'RELIANCE',
            button.getAttribute('data-range') || '1M'
          );
        }
      });
    });

    renderTradeOptions();
    renderDetail('RELIANCE');
    renderStockCards();
    renderGainersLosers();
    renderWatchlist();
    renderTransactions();
    updateOrderValue();
  };

  const ensureBrandLockup = () => {
    document.querySelectorAll('.brand-block, .footer-brand').forEach((brandWrap) => {
      if (brandWrap.querySelector('.brand-wordmark-lockup')) {
        return;
      }

      const logo = brandWrap.querySelector('img.exact-brand, img.brand-logo, img.brand-icon');
      if (!logo) {
        return;
      }

      const lockup = document.createElement('div');
      lockup.className = 'brand-lockup';
      const parent = logo.parentNode;
      if (!parent || parent.classList.contains('brand-lockup')) {
        return;
      }

      parent.insertBefore(lockup, logo);
      lockup.appendChild(logo);

      const wordmark = document.createElement('div');
      wordmark.className = 'brand-wordmark-lockup';
      wordmark.setAttribute('aria-label', 'VERDICT AI');
      wordmark.innerHTML = '<span class="brand-word">VERDICT</span><span class="brand-accent">AI</span>';
      lockup.appendChild(wordmark);
    });
  };

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  ensureBrandLockup();
  setTheme(savedTheme);

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
    });

    themeToggle.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        let nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

        if (event.key === 'ArrowLeft') {
          nextTheme = 'light';
        }

        if (event.key === 'ArrowRight') {
          nextTheme = 'dark';
        }

        setTheme(nextTheme);
      }
    });
  }

  if (demoLoginButton) {
    demoLoginButton.addEventListener('click', goToDashboard);
  }

  navItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const isLogoutLink = item.dataset.logout === 'true';
      if (isLogoutLink) {
        localStorage.removeItem(DEMO_MODE_KEY);
        localStorage.removeItem('verdict-user-id');
        localStorage.removeItem('verdict-user-name');
        localStorage.removeItem('verdict-selected-symbol');
        localStorage.removeItem(WATCHLIST_KEY);
        localStorage.removeItem(TRANSACTIONS_KEY);
        return;
      }

      navItems.forEach((navItem) => navItem.classList.remove('active'));
      item.classList.add('active');

      if (sidebar && sidebar.classList.contains('is-open')) {
        sidebar.classList.remove('is-open');
        if (menuToggle) {
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  const initCircuitBreakerPage = () => {
    const form = document.querySelector('.circuit-form');
    const summary = document.getElementById('circuit-summary');
    const history = document.getElementById('circuit-history');
    const cooling = document.getElementById('circuit-cooling');

    if (!form || !summary || !history || !cooling) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const stock = (formData.get('stock') || 'RELIANCE').toString().trim().toUpperCase() || 'RELIANCE';
      const exchange = (formData.get('exchange') || 'NSE').toString();
      const action = (formData.get('action') || 'Buy').toString();
      const quantity = Number(formData.get('quantity') || 0);
      const reason = (formData.get('reason') || '').toString().trim();

      if (!stock || !quantity) {
        summary.textContent = 'Please provide a valid stock symbol and quantity to run the behavioural review.';
        history.textContent = 'No trade data available yet.';
        cooling.textContent = 'Enter the intended trade details to generate a cooling-off recommendation.';
        return;
      }

      const isBuy = action === 'Buy';
      summary.textContent = isBuy
        ? `${stock} on ${exchange} appears to be a fast-entry decision. A short pause may help prevent emotional buying when momentum is surging.`
        : `${stock} on ${exchange} appears to be an impulsive exit decision. A cooling-off review may help reduce regret-driven selling.`;

      history.textContent = `${quantity} shares matched 3 of 5 similar ${isBuy ? 'buy' : 'sell'} decisions triggered by ${reason || 'short-term momentum'} near the prior day high.`;
      cooling.textContent = 'Cooling-off suggestion: wait 24 hours, recheck the setup, and trade only if the thesis still holds after the market opens.';
    });
  };

  const initFeatureState = () => {
    const buttons = document.querySelectorAll('.state-btn');
    const panels = document.querySelectorAll('.analysis-state');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((item) => item.classList.toggle('active', item === button));
        const nextState = button.getAttribute('data-state');
        panels.forEach((panel) => {
          const visible = panel.getAttribute('data-panel') === nextState;
          panel.classList.toggle('visible', visible);
        });
      });
    });
  };

  const demoCandleSeeds = {
    'NIFTY 50': [1842, 1830, 1850, 1845, 1862, 1854, 1870, 1861, 1885, 1874, 1889, 1896, 1908, 1897, 1912, 1902, 1925, 1919, 1932, 1924, 1941, 1938, 1948, 1942, 1957, 1951, 1963, 1958, 1969, 1972, 1988, 1980, 1994, 2001, 2013, 2008, 2020, 2015, 2032, 2026, 2041, 2037, 2055, 2049, 2062, 2058, 2074, 2066, 2081, 2079, 2094, 2085, 2102, 2098, 2110, 2106],
    'RELIANCE': [2950, 2930, 2965, 2958, 2988, 2992, 3015, 3004, 3032, 3028, 3048, 3053, 3071, 3065, 3084, 3079, 3106, 3114, 3130, 3122, 3148, 3140, 3168, 3160, 3182, 3176, 3195, 3201, 3214, 3208, 3232, 3228, 3247, 3241, 3261, 3255, 3274, 3267, 3289, 3280, 3304, 3296, 3317, 3311, 3339, 3331, 3358, 3354, 3372, 3368, 3384, 3379],
    'WATCHLIST': [1340, 1333, 1352, 1341, 1364, 1358, 1371, 1367, 1388, 1380, 1395, 1391, 1410, 1406, 1422, 1417, 1435, 1430, 1449, 1442, 1460, 1456, 1473, 1469, 1490, 1485, 1508, 1502, 1517, 1511, 1530, 1526, 1548, 1541, 1560, 1557, 1578, 1573, 1592, 1587, 1605, 1600, 1621, 1617, 1638, 1633, 1652, 1648, 1666, 1661, 1688, 1681],
    'PORTFOLIO': [960, 955, 974, 968, 982, 979, 993, 987, 1008, 1002, 1016, 1012, 1034, 1028, 1045, 1039, 1058, 1053, 1070, 1066, 1087, 1082, 1102, 1097, 1115, 1110, 1130, 1124, 1150, 1146, 1162, 1158, 1179, 1174, 1194, 1189, 1210, 1206, 1229, 1225, 1244, 1239, 1260, 1253, 1276, 1271, 1292, 1287, 1307, 1302, 1325, 1319]
  };

  const getCandleColor = (open, close) => {
    if (close > open) return '#16A34A';
    if (close < open) return '#DC2626';
    return '#94A3B8';
  };

  const generateCandlestickSeries = (symbol, rangeLabel) => {
    const base = demoCandleSeeds[symbol] || demoCandleSeeds['NIFTY 50'];
    const total = 40;
    const entries = [];
    const stepMinutes = rangeLabel === '1D' ? 30 : rangeLabel === '1W' ? 90 : rangeLabel === '1M' ? 180 : 360;

    for (let i = 0; i < total; i += 1) {
      // Adjacent sample values create genuine advances and pullbacks.
      const open = base[i % base.length];
      const close = base[(i + 1) % base.length];
      const wick = 0.004 + (i % 4) * 0.002;
      const high = Math.max(open, close) * (1 + wick);
      const low = Math.min(open, close) * (1 - wick);
      const time = new Date(Date.now() - (total - i) * stepMinutes * 60 * 1000);
      entries.push({
        time: Math.floor(time.getTime() / 1000),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        color: getCandleColor(open, close),
      });
    }
    return entries;
  };

  const addCandlestickSeries = (chart, options) => {
    if (chart.addCandlestickSeries && typeof chart.addCandlestickSeries === 'function') {
      return chart.addCandlestickSeries(options);
    }

    if (typeof LightweightCharts !== 'undefined' && LightweightCharts.CandlestickSeries) {
      return chart.addSeries(LightweightCharts.CandlestickSeries, options);
    }

    if (typeof window !== 'undefined' && window.CandlestickSeries) {
      return chart.addSeries(window.CandlestickSeries, options);
    }

    return null;
  };

  const renderCandlestickChart = (container, symbol, rangeLabel = '1M') => {
    if (!container || typeof window.LightweightCharts === 'undefined') {
      return;
    }

    const existing = container.querySelector('.chart-candlestick-root');
    if (existing) {
      existing.remove();
    }

    const chartHost = document.createElement('div');
    chartHost.className = 'chart-candlestick-root';
    chartHost.setAttribute('aria-label', `${symbol} illustrative candlestick chart`);
    container.appendChild(chartHost);

    const chart = LightweightCharts.createChart(chartHost, {
      width: container.clientWidth || 720,
      height: 250,
      layout: {
        background: { color: 'transparent' },
        textColor: getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1d302f'
      },
      grid: {
        vertLines: { color: 'rgba(146, 166, 165, 0.18)' },
        horzLines: { color: 'rgba(146, 166, 165, 0.18)' }
      },
      crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
      rightPriceScale: { borderColor: 'rgba(146, 166, 165, 0.18)' },
      timeScale: { borderColor: 'rgba(146, 166, 165, 0.18)' },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
    });

    const series = addCandlestickSeries(chart, {
      upColor: '#16A34A',
      downColor: '#DC2626',
      borderVisible: true,
      borderUpColor: '#16A34A',
      borderDownColor: '#DC2626',
      wickUpColor: '#16A34A',
      wickDownColor: '#DC2626',
      priceLineVisible: true
    });

    if (series) {
      series.setData(generateCandlestickSeries(symbol, rangeLabel));
    }
    chart.timeScale().fitContent();

    const label = document.createElement('div');
    label.className = 'chart-legend';
    label.textContent = `${symbol} · ${rangeLabel} · illustrative demo data`;
    container.appendChild(label);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth || 720 });
    });
    resizeObserver.observe(container);
  };

  const initCandlestickCharts = () => {
    const containers = document.querySelectorAll('[data-candlestick]');
    containers.forEach((container) => {
      const symbol = container.getAttribute('data-candlestick') || 'NIFTY 50';
      const range = container.getAttribute('data-range') || '1M';
      renderCandlestickChart(container, symbol, range);
    });
  };

  const initDashboardMarketOverview = () => {
    const container = document.getElementById('market-overview-chart');
    const stockSelect = document.getElementById('market-stock-select');
    const rangeButtons = document.querySelectorAll('.range-btn');
    const priceEl = document.getElementById('market-title');

    if (!container || typeof window.LightweightCharts === 'undefined') {
      return;
    }

    const syncDashboardPrice = (symbol, rangeLabel) => {
      if (!priceEl) return;
      const data = generateCandlestickSeries(symbol, rangeLabel);
      const latest = data[data.length - 1];
      if (!latest) return;
      const value = Number(latest.close || 0);
      priceEl.textContent = formatMoney(value);
      const changeEl = priceEl.nextElementSibling;
      if (changeEl && changeEl.classList.contains('change')) {
        const previous = data[data.length - 2];
        const delta = previous ? ((value - previous.close) / previous.close) * 100 : 0;
        changeEl.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% today`;
        changeEl.classList.toggle('positive', delta >= 0);
        changeEl.classList.toggle('negative', delta < 0);
      }
    };

    const renderDashboardChart = () => {
      const selectedSymbol = stockSelect ? stockSelect.value : 'NIFTY 50';
      const selectedRange = document.querySelector('.range-btn.active')
        ? document.querySelector('.range-btn.active').getAttribute('data-range-option') || '1M'
        : '1M';

      container.innerHTML = '';
      const chartHost = document.createElement('div');
      chartHost.className = 'chart-candlestick-root';
      chartHost.setAttribute('aria-label', `${selectedSymbol} market overview chart`);
      container.appendChild(chartHost);

      const chart = LightweightCharts.createChart(chartHost, {
        width: container.clientWidth || 720,
        height: 300,
        layout: {
          background: { color: 'transparent' },
          textColor: getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1d302f'
        },
        grid: {
          vertLines: { color: 'rgba(146, 166, 165, 0.18)' },
          horzLines: { color: 'rgba(146, 166, 165, 0.18)' }
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
        rightPriceScale: { borderColor: 'rgba(146, 166, 165, 0.18)' },
        timeScale: { borderColor: 'rgba(146, 166, 165, 0.18)' },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
      });

      const series = addCandlestickSeries(chart, {
        upColor: '#16A34A',
        downColor: '#DC2626',
        borderVisible: true,
        borderUpColor: '#16A34A',
        borderDownColor: '#DC2626',
        wickUpColor: '#16A34A',
        wickDownColor: '#DC2626',
        priceLineVisible: true
      });

      if (series) {
        series.setData(generateCandlestickSeries(selectedSymbol, selectedRange));
      }
      chart.timeScale().fitContent();
      syncDashboardPrice(selectedSymbol, selectedRange);

      const resizeObserver = new ResizeObserver(() => {
        chart.applyOptions({ width: container.clientWidth || 720 });
      });
      resizeObserver.observe(container);
    };

    if (stockSelect) {
      stockSelect.addEventListener('change', renderDashboardChart);
    }

    rangeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        rangeButtons.forEach((item) => item.classList.toggle('active', item === button));
        renderDashboardChart();
      });
    });

    renderDashboardChart();
  };

  initLoginPage();
  initUserBadge();
  initCandlestickCharts();
  initDashboardMarketOverview();
  initInvestPage();
  initCollectionPage();
  initCircuitBreakerPage();
  initFeatureState();
});


// Load the API-connected frontend layer after the existing UI initializers.
(() => {
  const script = document.createElement('script');
  script.src = '/static/js/backend-integration.js';
  script.defer = true;
  document.body.appendChild(script);
})();
