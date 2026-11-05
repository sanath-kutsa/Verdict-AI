(() => {
  const init = () => {
    const page = document.body.dataset.page || "";
    const userId = Number(localStorage.getItem("verdict-user-id") || 0);
    const userName = localStorage.getItem("verdict-user-name") || "Demo Investor";
    const prices = {
      RELIANCE: 2978.6,
      TCS: 3754.2,
      INFY: 1562.45,
      HDFCBANK: 1712.8,
      ICICIBANK: 1288.6,
      SBIN: 936.75,
      NOVA: 100
    };
    const money = value => new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 2
    }).format(Number(value || 0));
    const safe = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
    const request = async (url, options) => {
      const response = await fetch(url, options || {});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The request could not be completed.");
      return data;
    };
    const jsonPost = body => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const showMessage = (element, message, isError) => {
      if (!element) return;
      element.textContent = message;
      element.classList.add("visible");
      element.style.borderLeft = isError ? "3px solid #dc2626" : "3px solid #16a34a";
    };
    const requireUser = element => {
      if (userId) return true;
      showMessage(element, "Please sign in through the demo login before using your personal portfolio. Your browser has no active demo user ID.", true);
      return false;
    };

    const ensureDashboardSnapshot = () => {
      if (document.getElementById("backend-portfolio-snapshot")) return;
      const topGrid = document.querySelector(".top-grid");
      if (!topGrid) return;
      const section = document.createElement("section");
      section.id = "backend-portfolio-snapshot";
      section.className = "feature-panel";
      section.style.marginTop = "20px";
      section.innerHTML =
        '<div class="feature-summary"><div><span class="eyebrow">Your demo account</span><h2>Portfolio snapshot</h2><p>Live values from your saved simulated transactions.</p></div><a href="/portfolio" class="secondary-btn">View portfolio</a></div>' +
        '<div class="signal-grid">' +
          '<article class="signal-card"><span class="signal-label neutral">Available cash</span><h3 id="dash-cash">Loading…</h3><p>Uninvested simulated balance</p></article>' +
          '<article class="signal-card"><span class="signal-label neutral">Invested value</span><h3 id="dash-invested">Loading…</h3><p>Cost basis of open holdings</p></article>' +
          '<article class="signal-card"><span class="signal-label neutral">Open positions</span><h3 id="dash-positions">Loading…</h3><p>Distinct symbols currently held</p></article>' +
          '<article class="signal-card"><span class="signal-label neutral">Recorded trades</span><h3 id="dash-trades">Loading…</h3><p>Transactions saved to SQLite</p></article>' +
        '</div>' +
        '<div class="panel-card" style="margin-top:16px;padding:18px;"><h3>Recent transactions</h3><ul id="dash-recent-trades" class="transaction-list"><li>Loading transactions…</li></ul></div>' +
        '<p id="dash-api-message" class="confirmation-box" aria-live="polite"></p>';
      topGrid.insertAdjacentElement("afterend", section);
    };

    const renderHoldingsList = (holdings, list) => {
      if (!list) return;
      if (!holdings || !holdings.length) {
        list.innerHTML = '<li class="watchlist-item"><span>No open holdings yet. Place a simulated order in Invest.</span></li>';
        return;
      }
      list.innerHTML = holdings.map(item =>
        '<li class="watchlist-item"><div><strong>' + safe(item.symbol) + '</strong><br><small>' +
        safe(item.quantity) + ' shares · Avg. cost ' + money(item.average_cost) +
        '</small></div><strong>' + money(item.invested_value) + '</strong></li>'
      ).join("");
    };

    const refreshAccount = async () => {
      if (!userId) return null;
      const [portfolio, tradeData] = await Promise.all([
        request("/api/users/" + userId + "/portfolio"),
        request("/api/users/" + userId + "/trades")
      ]);
      const holdings = portfolio.holdings || [];
      const invested = holdings.reduce((sum, item) => sum + Number(item.invested_value || 0), 0);
      const trades = tradeData.trades || [];
      const recent = trades.slice(-5).reverse();

      const dashCash = document.getElementById("dash-cash");
      const dashInvested = document.getElementById("dash-invested");
      const dashPositions = document.getElementById("dash-positions");
      const dashTrades = document.getElementById("dash-trades");
      if (dashCash) dashCash.textContent = money(portfolio.cash_balance);
      if (dashInvested) dashInvested.textContent = money(invested);
      if (dashPositions) dashPositions.textContent = String(holdings.length);
      if (dashTrades) dashTrades.textContent = String(portfolio.trade_count || 0);

      const recentList = document.getElementById("dash-recent-trades");
      if (recentList) {
        recentList.innerHTML = recent.length ? recent.map(item =>
          '<li class="transaction-item"><div><strong>' + safe(item.action) + ' ' +
          safe(item.quantity) + ' ' + safe(item.symbol) + '</strong><br><small>' +
          safe(item.date || "Demo trade") + '</small></div><strong>' +
          money(Number(item.quantity) * Number(item.price)) + '</strong></li>'
        ).join("") : '<li class="transaction-item">No transactions recorded yet.</li>';
      }

      const investPortfolio = document.querySelector(".invest-side .portfolio-grid");
      if (investPortfolio) {
        const rows = investPortfolio.querySelectorAll(".value-row");
        if (rows[0]) rows[0].querySelector("strong").textContent = money(portfolio.cash_balance);
        if (rows[1]) rows[1].querySelector("strong").textContent = money(invested);
        if (rows[2]) {
          rows[2].querySelector("span").textContent = "Recorded trades";
          rows[2].querySelector("strong").textContent = String(portfolio.trade_count || 0);
        }
      }

      if (page === "portfolio") {
        const rows = document.querySelectorAll(".feature-panel > .panel-card .portfolio-grid .value-row");
        if (rows[0]) {
          rows[0].querySelector("span").textContent = "Portfolio cost basis + cash";
          rows[0].querySelector("strong").textContent = money(invested + Number(portfolio.cash_balance || 0));
        }
        if (rows[1]) {
          rows[1].querySelector("span").textContent = "Cash balance";
          rows[1].querySelector("strong").textContent = money(portfolio.cash_balance);
        }
        if (rows[2]) {
          rows[2].querySelector("span").textContent = "Recorded trades";
          rows[2].querySelector("strong").textContent = String(portfolio.trade_count || 0);
        }
        const allocation = document.querySelector(".feature-panel > .panel-card .allocation-visual");
        if (allocation) allocation.style.display = "none";
        renderHoldingsList(holdings, document.getElementById("demo-collection-list"));
      }
      return { portfolio, trades, holdings, invested };
    };

    if (page === "dashboard") {
      ensureDashboardSnapshot();
      const message = document.getElementById("dash-api-message");
      if (requireUser(message)) {
        refreshAccount().catch(error => showMessage(message, error.message, true));
      } else {
        const cash = document.getElementById("dash-cash");
        if (cash) cash.textContent = "Sign in required";
      }
    }

    if (page === "invest") {
      const form = document.getElementById("trade-form");
      const confirmation = document.getElementById("trade-confirmation");
      if (form) {
        form.addEventListener("submit", async event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!requireUser(confirmation)) return;
          const symbol = String(document.getElementById("trade-symbol")?.value || "").toUpperCase();
          const action = String(document.getElementById("trade-side")?.value || "buy").toUpperCase();
          const quantity = Number(document.getElementById("trade-qty")?.value || 0);
          const price = prices[symbol] || 100;
          if (!symbol || !Number.isFinite(quantity) || quantity <= 0) {
            showMessage(confirmation, "Enter a valid symbol and quantity.", true);
            return;
          }
          const submit = form.querySelector('[type="submit"]');
          if (submit) { submit.disabled = true; submit.textContent = "Saving simulated order…"; }
          try {
            const data = await request("/api/users/" + userId + "/trades", jsonPost({
              symbol, action, quantity, price,
              reason: "Paper trade submitted through the Verdict AI demo."
            }));
            showMessage(confirmation,
              action + " order saved: " + quantity + " " + symbol + " at " + money(price) +
              ". Updated cash balance: " + money(data.portfolio.cash_balance) +
              ". This is a simulated transaction only.", false);
            await refreshAccount();
            const history = document.getElementById("transaction-list");
            if (history) {
              const tradeData = await request("/api/users/" + userId + "/trades");
              history.innerHTML = tradeData.trades.slice(-5).reverse().map(item =>
                '<li class="transaction-item"><div><strong>' + safe(item.action) + ' ' +
                safe(item.quantity) + ' ' + safe(item.symbol) + '</strong><br><small>' +
                safe(item.date) + '</small></div><strong>' +
                money(Number(item.quantity) * Number(item.price)) + '</strong></li>'
              ).join("") || '<li class="transaction-item">No transactions yet.</li>';
            }
          } catch (error) {
            showMessage(confirmation, error.message, true);
          } finally {
            if (submit) { submit.disabled = false; submit.textContent = "Confirm order"; }
          }
        }, true);
      }
      refreshAccount().catch(error => console.warn("Portfolio could not be loaded:", error.message));
    }

    if (page === "portfolio") {
      if (requireUser(document.querySelector(".feature-summary p"))) {
        refreshAccount().catch(error => console.warn("Portfolio could not be loaded:", error.message));
      }
    }

    if (page === "investor_dna") {
      const panel = document.querySelector('.analysis-state[data-panel="demo"]');
      const button = document.querySelector(".feature-card .primary-btn");
      const loadDNA = async () => {
        if (!requireUser(panel)) return;
        if (button) { button.disabled = true; button.textContent = "Analysing saved trades…"; }
        try {
          const data = await request("/api/investor-dna?user_id=" + userId);
          const result = data.result || {};
          const findings = (data.explanation && data.explanation.key_findings) || [];
          if (panel) {
            panel.innerHTML =
              '<span class="score-pill success">Based on ' + safe(result.sample_size || 0) + ' saved trades</span>' +
              '<div style="margin-top:12px;"><h3>' + safe(result.investor_name || userName) + '’s observed trading profile</h3>' +
              '<p>' + safe((data.explanation && data.explanation.summary) || "Descriptive analysis of your simulated trade history.") + '</p></div>' +
              '<div class="list-stack">' +
                '<div class="list-item"><span>Buy / Sell orders</span><strong>' + safe(result.buy_count || 0) + ' / ' + safe(result.sell_count || 0) + '</strong></div>' +
                '<div class="list-item"><span>Average buy value</span><strong>' + money(result.average_buy_value) + '</strong></div>' +
                '<div class="list-item"><span>Most traded symbol</span><strong>' + safe(result.most_traded_symbol || "Not enough data") + '</strong></div>' +
                '<div class="list-item"><span>Realised P&amp;L</span><strong>' + money(result.realised_pnl) + '</strong></div>' +
                '<div class="list-item"><span>Momentum-language buys</span><strong>' + safe(result.impulse_buy_count || 0) + '</strong></div>' +
              '</div><ul class="risk-list">' + findings.map(item => '<li>' + safe(item) + '</li>').join("") + '</ul>' +
              '<p class="demo-data-label">Simulated sample only. This is descriptive analysis, not a personality assessment or investment advice.</p>';
          }
        } catch (error) {
          if (panel) showMessage(panel, error.message, true);
        } finally {
          if (button) { button.disabled = false; button.textContent = "Refresh behaviour profile"; }
        }
      };
      if (button) button.addEventListener("click", loadDNA);
      loadDNA();
    }

    if (page === "circuit_breaker") {
      const form = document.querySelector(".circuit-form");
      const summary = document.getElementById("circuit-summary");
      const history = document.getElementById("circuit-history");
      const cooling = document.getElementById("circuit-cooling");
      if (form) {
        form.addEventListener("submit", async event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!requireUser(summary)) return;
          const formData = new FormData(form);
          const symbol = String(formData.get("stock") || "NOVA").trim().toUpperCase();
          const action = String(formData.get("action") || "BUY").toUpperCase();
          const quantity = Number(formData.get("quantity") || 0);
          const reason = String(formData.get("reason") || "");
          const price = prices[symbol] || 100;
          const button = form.querySelector('[type="submit"]');
          if (button) { button.disabled = true; button.textContent = "Checking saved behaviour…"; }
          try {
            const data = await request("/api/circuit-breaker", jsonPost({
              user_id: userId,
              proposed_trade: { symbol, action, quantity, price, reason }
            }));
            const result = data.result || {};
            summary.textContent = (data.explanation && data.explanation.summary) || "Behavioural comparison completed.";
            history.textContent = (result.flags || []).map(flag => flag.message).join(" ") ||
              "No matching historical behaviour was found in this sample.";
            cooling.textContent = result.risk_level === "review"
              ? "Review flag detected. Pause and independently reassess the assumptions before deciding what to do."
              : result.risk_level === "notice"
                ? "A historical similarity was found. Review the context and your original reasoning."
                : "No configured warning was triggered. This does not establish that the proposed trade is suitable.";
          } catch (error) {
            summary.textContent = error.message;
            history.textContent = "The backend could not complete this analysis.";
            cooling.textContent = "Check your demo login and try again.";
          } finally {
            if (button) { button.disabled = false; button.textContent = "Analyze Decision"; }
          }
        }, true);
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();