(() => {
  "use strict";

  const start = () => {
    const page = document.body.dataset.page || "";
    const userId = Number(localStorage.getItem("verdict-user-id") || 0);
    const userName = localStorage.getItem("verdict-user-name") || "Demo Investor";
    const WATCHLIST_KEY = "verdict-watchlist";
    const PRICE = { RELIANCE: 2978.6, TCS: 3754.2, INFY: 1562.45, HDFCBANK: 1712.8, ICICIBANK: 1288.6, SBIN: 936.75, NOVA: 100, ORBIT: 85, PULSE: 62, ZENITH: 140 };
    const SAMPLE_SYMBOLS = new Set(["NOVA", "ORBIT", "PULSE", "ZENITH"]);
    const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
    const api = async (url, body) => {
      const response = await fetch(url, body === undefined ? {} : {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The analysis request failed.");
      return data;
    };
    const notice = (target, message, error) => {
      if (!target) return;
      target.textContent = message;
      target.classList.add("visible");
      target.style.borderLeft = "3px solid " + (error ? "#dc2626" : "#16a34a");
    };
    const requireUser = target => {
      if (userId) return true;
      notice(target, "Sign in through the demo login to load your personal simulated trade history.", true);
      return false;
    };
    const setBusy = (button, busy, label) => {
      if (!button) return;
      if (busy) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.textContent = label || "Analysing…";
      } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "Run analysis";
      }
    };
    const resultPanel = () => document.querySelector(".analysis-state[data-panel='demo']") || document.querySelector(".feature-card.result-stack");
    const renderPanel = (html) => {
      const panel = resultPanel();
      if (!panel) return;
      document.querySelectorAll(".analysis-state").forEach(item => item.classList.toggle("visible", item === panel));
      panel.innerHTML = html;
    };
    const findingsHtml = items => (items || []).map(item => "<li>" + esc(item) + "</li>").join("");
    const resultHeading = (pill, summary) =>
      '<span class="score-pill">' + esc(pill) + '</span><div style="margin-top:12px"><h3>' + esc(summary) + '</h3></div>';
    const renderGeneric = (data, details, pill) => {
      const explanation = data.explanation || {};
      renderPanel(
        resultHeading(pill || "Analysis complete", explanation.summary || "The simulated analysis is complete.") +
        (details || "") +
        '<h4 style="margin-top:16px">Key findings</h4><ul class="risk-list">' + findingsHtml(explanation.key_findings) + '</ul>' +
        '<p class="demo-data-label">SIMULATED DATA · ' + esc(explanation.confidence || "Illustrative analysis") + '</p>' +
        '<details style="margin-top:10px"><summary>Limitations</summary><ul class="risk-list">' + findingsHtml(explanation.limitations) + '</ul></details>'
      );
    };
    const getFeatureControls = () => {
      const card = document.querySelector(".feature-grid > .feature-card:first-child");
      return {
        card,
        button: card && card.querySelector(".primary-btn"),
        inputs: card ? Array.from(card.querySelectorAll("input,select,textarea")) : [],
        byLabel(label) {
          return this.inputs.find(el => (el.getAttribute("aria-label") || "").toLowerCase() === label.toLowerCase());
        }
      };
    };
    const symbolFrom = (raw, fallback) => {
      const match = String(raw || "").toUpperCase().match(/[A-Z][A-Z0-9]{1,14}/);
      const symbol = match ? match[0] : fallback;
      return SAMPLE_SYMBOLS.has(symbol) ? symbol : fallback;
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
        '<article class="signal-card"><span class="signal-label neutral">Invested cost</span><h3 id="dash-invested">Loading…</h3><p>Cost basis of open holdings</p></article>' +
        '<article class="signal-card"><span class="signal-label neutral">Open positions</span><h3 id="dash-positions">Loading…</h3><p>Distinct symbols held</p></article>' +
        '<article class="signal-card"><span class="signal-label neutral">Recorded trades</span><h3 id="dash-trades">Loading…</h3><p>Transactions saved in SQLite</p></article></div>' +
        '<div class="panel-card" style="margin-top:16px;padding:18px"><h3>Recent transactions</h3><ul id="dash-recent-trades" class="transaction-list"><li>Loading…</li></ul></div>' +
        '<p id="dash-api-message" class="confirmation-box" aria-live="polite"></p>';
      topGrid.insertAdjacentElement("afterend", section);
    };

    const renderTrades = (trades, list) => {
      if (!list) return;
      const recent = (trades || []).slice(-5).reverse();
      list.innerHTML = recent.length ? recent.map(item =>
        '<li class="transaction-item"><div><strong>' + esc(item.action) + ' ' + esc(item.quantity) + ' ' + esc(item.symbol) +
        '</strong><br><small>' + esc(item.date || "Demo trade") + '</small></div><strong>' +
        money(Number(item.quantity) * Number(item.price)) + '</strong></li>'
      ).join("") : '<li class="transaction-item">No transactions recorded yet.</li>';
    };

    const refreshAccount = async () => {
      if (!userId) return null;
      const [portfolioData, tradeData] = await Promise.all([
        api("/api/users/" + userId + "/portfolio"),
        api("/api/users/" + userId + "/trades")
      ]);
      const holdings = portfolioData.holdings || [];
      const trades = tradeData.trades || [];
      const invested = holdings.reduce((sum, item) => sum + Number(item.invested_value || 0), 0);
      const cash = Number(portfolioData.cash_balance || 0);
      const totalCost = invested + cash;
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
      set("dash-cash", money(cash));
      set("dash-invested", money(invested));
      set("dash-positions", String(holdings.length));
      set("dash-trades", String(portfolioData.trade_count || trades.length));
      renderTrades(trades, document.getElementById("dash-recent-trades"));
      renderTrades(trades, document.getElementById("transaction-list"));

      const investGrid = document.querySelector(".invest-side .portfolio-grid");
      if (investGrid) {
        const rows = investGrid.querySelectorAll(".value-row");
        if (rows[0]) rows[0].querySelector("strong").textContent = money(cash);
        if (rows[1]) rows[1].querySelector("strong").textContent = money(invested);
        if (rows[2]) { rows[2].querySelector("span").textContent = "Recorded trades"; rows[2].querySelector("strong").textContent = String(trades.length); }
      }
      if (page === "portfolio") {
        const rows = document.querySelectorAll(".feature-panel > .panel-card .portfolio-grid .value-row");
        if (rows[0]) { rows[0].querySelector("span").textContent = "Cash + invested cost"; rows[0].querySelector("strong").textContent = money(totalCost); }
        if (rows[1]) { rows[1].querySelector("span").textContent = "Available cash"; rows[1].querySelector("strong").textContent = money(cash); }
        if (rows[2]) { rows[2].querySelector("span").textContent = "Recorded trades"; rows[2].querySelector("strong").textContent = String(trades.length); }
        const allocation = document.querySelector(".allocation-visual");
        if (allocation) allocation.style.display = "none";
        const list = document.getElementById("demo-collection-list");
        if (list) list.innerHTML = holdings.length ? holdings.map(item =>
          '<li class="watchlist-item"><div><strong>' + esc(item.symbol) + '</strong><br><small>' + esc(item.quantity) +
          ' shares · Average cost ' + money(item.average_cost) + '</small></div><strong>' + money(item.invested_value) + '</strong></li>'
        ).join("") : '<li class="watchlist-item">No open holdings yet. Place a simulated order in Invest.</li>';
      }
      return { portfolio: portfolioData, trades, holdings, invested };
    };


    const initFeatureWorkspace = () => {
      const root = document.querySelector(".feature-panel");
      if (!root) return;
      const specs = {
        investor_dna: {
          title:"Investor DNA assessment", intro:"Combine your saved paper-trade history with your own answers. The result describes observed patterns, not your personality.",
          endpoint:"/api/investor-dna", fields:[
            ["risk_style","Risk tolerance","select",["Conservative","Moderate","Aggressive"]],
            ["bias","Most common decision bias","select",["FOMO / momentum chasing","Loss aversion","Overconfidence","Confirmation bias","No clear pattern"]],
            ["goal","Primary investing goal","select",["Long-term wealth creation","Capital preservation","Short-term trading","Learning and experimentation"]],
            ["user_note","Describe how you make decisions","textarea","I sometimes buy after a sharp price rise because I worry about missing out."]
          ]
        },
        circuit_breaker: {
          title:"Proposed trade review", intro:"Enter the trade you are considering. Verdict compares its stated reason with your saved paper-trade behaviour and transparent keyword rules.",
          endpoint:"/api/circuit-breaker", fields:[
            ["symbol","Stock symbol","text","RELIANCE"],
            ["exchange","Exchange","select",["NSE","BSE"]],
            ["action","Intended action","select",["BUY","SELL"]],
            ["quantity","Quantity","number","10"],
            ["price","Planned price (₹)","number","100"],
            ["reason","Why are you considering this trade?","textarea","The stock is trending online and I am worried about missing the breakout."],
            ["emotional_state","Current emotional state","select",["Calm","Excited","Anxious","Frustrated","Fearful","Unsure"]],
            ["confidence","Confidence level","select",["Low","Moderate","High","Very high"]]
          ]
        },
        stress_test: {
          title:"Portfolio stress scenario", intro:"Choose a holding and apply a hypothetical price shock. Enter the symbol, quantity and reference price explicitly; no live quote is assumed.",
          endpoint:"/api/stress-test", fields:[
            ["symbol","Stock symbol","text","RELIANCE"],
            ["quantity","Quantity held","number","10"],
            ["current_price","Reference price per share (₹)","number","1000"],
            ["scenario_change_pct","Hypothetical price change (%)","number","-20"],
            ["assumption","Scenario assumptions","textarea","Assume a broad market sell-off and weaker sector demand."]
          ]
        },
        regret_replay: {
          title:"Trade-history replay", intro:"Replay eligible SELL transactions saved in your account against the next available observation in the bundled sample history. No hindsight price will be invented.",
          endpoint:"/api/regret-replay", fields:[
            ["trade_type","Trade type filter","select",["All sell decisions","Momentum exits","Fear-driven exits"]],
            ["lookback_days","Lookback period (days)","number","90"],
            ["review_note","What would you like to reflect on?","textarea","I exited because of short-term fear. I want to understand what the later sample showed."]
          ]
        },
        hype_radar: {
          title:"Narrative and hype analysis", intro:"Paste the narrative or claims you are seeing. The backend checks language signals and, separately, any available simulated mention history. It does not fetch social media.",
          endpoint:"/api/hype-radar", fields:[
            ["theme","Company or theme","text","AI infrastructure"],
            ["signal_source","Where did you see this?","select",["News","Retail chatter","Analyst commentary","Social media","Other"]],
            ["narrative","Paste the narrative or claims","textarea","Every AI company is going to become extremely profitable. Investors are rushing in because demand will grow indefinitely."],
            ["spike_multiplier","Mention-spike threshold (x)","number","2"]
          ]
        },
        move_autopsy: {
          title:"Price-move autopsy", intro:"Describe a move and provide the observations you actually have. The analysis separates supplied evidence from interpretation.",
          endpoint:"/api/move-autopsy", fields:[
            ["symbol","Stock symbol","text","RELIANCE"],
            ["move_type","Move type","select",["Breakout","Gap up","Gap down","Rally","Sell-off","Reversal","Fade"]],
            ["price_change_pct","Observed price change (%)","number","5"],
            ["volume_multiple","Volume vs average (x)","number","2.1"],
            ["catalyst","Known catalyst (enter None if unknown)","text","Quarterly results"],
            ["move_context","What happened?","textarea","The stock rose around 5% after results, with volume about 2.1 times its recent average."]
          ]
        },
        bull_bear: {
          title:"Bull vs Bear thesis comparison", intro:"Provide both sides of the argument. Verdict compares the claims and highlights assumptions that need evidence.",
          endpoint:"/api/bull-vs-bear", fields:[
            ["symbol","Stock symbol / company","text","RELIANCE"],
            ["horizon","Investment horizon","select",["Short term","6 to 12 months","1 to 3 years","3+ years"]],
            ["bull_thesis","Bull thesis","textarea","Demand is growing, the company is investing in new capacity, and revenue could expand over the next few years."],
            ["bear_thesis","Bear thesis","textarea","Valuation may already reflect optimistic growth, while higher costs could pressure margins."]
          ]
        },
        earnings_analysis: {
          title:"Earnings transcript analysis", intro:"Paste an earnings-call excerpt or management commentary. The backend flags cautious or vague wording and explains why it was flagged. It does not verify financial claims.",
          endpoint:"/api/earnings-language", fields:[
            ["company","Company name / symbol","text","RELIANCE"],
            ["quarter","Reporting quarter","text","Q2 FY2026"],
            ["transcript_text","Earnings transcript / management commentary","textarea","Revenue increased by 25% year over year. Net profit increased by 8%. Operating expenses rose due to research and development investments. Management expects demand to remain strong, but supply-chain costs could affect margins."]
          ]
        }
      };
      const spec = specs[page];
      if (!spec) return;
      const fieldHtml = spec.fields.map(([name,label,type,options]) => {
        const isTextArea = type === "textarea";
        const control = isTextArea
          ? '<textarea name="'+name+'" required rows="4" placeholder="'+(typeof options==="string"?esc(options):"")+'"></textarea>'
          : type === "select"
            ? '<select name="'+name+'" required>'+options.map((v,i)=>'<option value="'+esc(v)+'" '+(i===0?'selected':'')+'>'+esc(v)+'</option>').join("")+'</select>'
            : '<input name="'+name+'" type="'+type+'" '+(type==="number"?'step="any"':'')+' '+(["quantity","price","current_price","volume_multiple"].includes(name)?'min="0.0001"':name==="spike_multiplier"?'min="1.1" max="10"':name==="scenario_change_pct"?'min="-100" max="100"':'')+' required placeholder="'+esc(options||"")+'">';
        return '<label class="feature-input"><span>'+esc(label)+'</span>'+control+'</label>';
      }).join("");
      const formId = "verdict-feature-form";
      const outputId = "verdict-feature-output";
      const left = '<div class="feature-card"><h3>'+esc(spec.title)+'</h3><p>'+esc(spec.intro)+'</p><form id="'+formId+'" class="feature-form"><div class="input-grid">'+fieldHtml+'</div><button type="submit" class="primary-btn">Run analysis</button><p class="confirmation-box" id="feature-form-message" aria-live="polite"></p></form></div>';
      const right = '<div class="feature-card result-stack" id="'+outputId+'" aria-live="polite"><span class="score-pill">Awaiting your input</span><h3>Your results will appear here</h3><p>Complete the form and select Run analysis. No pre-filled demonstration result is shown.</p></div>';
      const grid = root.querySelector(".feature-grid");
      if (grid) grid.innerHTML = left + right;
      const form = document.getElementById(formId);
      const output = document.getElementById(outputId);
      const message = document.getElementById("feature-form-message");
      const submit = form.querySelector('[type="submit"]');
      const renderValue = (value) => {
        if (value == null || value === "") return "Not available";
        if (typeof value === "object") return Array.isArray(value) ? value.map(renderValue).join("; ") : Object.entries(value).map(([k,v])=>k.replaceAll("_"," ")+": "+renderValue(v)).join(" · ");
        return String(value);
      };
      form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!requireUser(message)) return;
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.user_id = userId;
        for (const [key,value] of Object.entries(payload)) {
          if (key !== "user_id" && form.elements.namedItem(key)?.type === "number") payload[key] = Number(value);
        }
        if (page === "circuit_breaker") {
          payload.proposed_trade = {symbol:payload.symbol, action:payload.action, quantity:payload.quantity, price:payload.price, reason:payload.reason, emotional_state:payload.emotional_state, confidence:payload.confidence};
        }
        setBusy(submit,true,"Running analysis…");
        output.innerHTML = '<span class="score-pill">Processing</span><h3>Analysing your submitted information…</h3><p>Waiting for the backend response.</p>';
        try {
          const data = await api(spec.endpoint,payload);
          const r = data.result || {};
          const findings = (data.explanation?.key_findings || []).map(x=>'<li>'+esc(x)+'</li>').join("");
          const metrics = Object.entries(r).filter(([k,v])=>!["evidence","shared_evidence","symbols","replays","positions","flags","drivers","bull_case","bear_case","closed_trade_sample","open_positions"].includes(k) && (typeof v!=="object" || v===null)).map(([k,v])=>'<div class="list-item"><span>'+esc(k.replaceAll("_"," "))+'</span><strong>'+esc(renderValue(v))+'</strong></div>').join("");
          const lists = [];
          for (const key of ["flags","drivers","positions","replays","bull_case","bear_case","symbols"]) {
            const value = r[key];
            if (Array.isArray(value) && value.length) lists.push('<h4>'+esc(key.replaceAll("_"," "))+'</h4><ul class="risk-list">'+value.map(item=>'<li>'+esc(renderValue(item))+'</li>').join("")+'</ul>');
          }
          output.innerHTML = '<span class="score-pill success">Analysis complete</span><h3>'+esc(data.explanation?.summary || "Backend analysis completed.")+'</h3><div class="list-stack">'+metrics+'</div>'+lists.join("")+'<h4>Key findings</h4><ul class="risk-list">'+findings+'</ul><p class="demo-data-label">'+esc(data.data_mode || "User-supplied input")+' · '+esc(data.explanation?.confidence || "See limitations")+'</p><details><summary>Limitations and methodology</summary><ul class="risk-list">'+(data.explanation?.limitations||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></details><details><summary>Raw backend result</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(JSON.stringify(r,null,2))+'</pre></details>';
          notice(message,"Analysis completed. Results below are from the backend response.",false);
        } catch(error) {
          output.innerHTML = '<span class="score-pill warning">Analysis failed</span><h3>'+esc(error.message)+'</h3><p>Check the input and Flask server, then try again.</p>';
          notice(message,error.message,true);
        } finally { setBusy(submit,false); }
      });
    };

    const initDashboard = () => {
      ensureDashboardSnapshot();
      const msg = document.getElementById("dash-api-message");
      if (userId) refreshAccount().catch(error => notice(msg, error.message, true));
      else notice(msg, "Sign in through the demo login to view your saved portfolio.", true);
      const search = document.querySelector('input[aria-label="Search a stock"]');
      const analyse = document.querySelector(".analyse-btn");
      if (analyse) analyse.addEventListener("click", () => {
        const query = search ? search.value.trim().toUpperCase() : "";
        if (query) localStorage.setItem("verdict-selected-symbol", query);
        window.location.href = "/invest";
      });
      if (search) search.addEventListener("keydown", event => {
        if (event.key === "Enter" && analyse) analyse.click();
      });
    };

    const initInvest = () => {
      const form = document.getElementById("trade-form");
      const message = document.getElementById("trade-confirmation");
      const symbolSelect = document.getElementById("trade-symbol");
      const searchButton = document.getElementById("search-button");
      const searchInput = document.getElementById("stock-search");
      if (searchButton && searchInput) searchButton.addEventListener("click", () => searchInput.dispatchEvent(new Event("input")));
      if (symbolSelect) {
        const pending = localStorage.getItem("verdict-selected-symbol");
        if (pending && Array.from(symbolSelect.options).some(option => option.value === pending)) {
          symbolSelect.value = pending;
          symbolSelect.dispatchEvent(new Event("change"));
          localStorage.removeItem("verdict-selected-symbol");
        }
      }
      if (form) form.addEventListener("submit", async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!requireUser(message)) return;
        const symbol = String(symbolSelect && symbolSelect.value || "").toUpperCase();
        const action = String(document.getElementById("trade-side")?.value || "buy").toUpperCase();
        const quantity = Number(document.getElementById("trade-qty")?.value || 0);
        const price = PRICE[symbol] || 100;
        if (!symbol || !Number.isFinite(quantity) || quantity <= 0) {
          notice(message, "Enter a valid stock and a quantity greater than zero.", true);
          return;
        }
        const button = form.querySelector('[type="submit"]');
        setBusy(button, true, "Saving simulated order…");
        try {
          const response = await api("/api/users/" + userId + "/trades", {
            symbol, action, quantity, price,
            reason: "Paper trade submitted through the Verdict AI demo."
          });
          notice(message, action + " order saved: " + quantity + " " + symbol + " at " + money(price) +
            ". Updated cash: " + money(response.portfolio.cash_balance) + ". Simulated transaction only.", false);
          await refreshAccount();
        } catch (error) {
          notice(message, error.message, true);
        } finally {
          setBusy(button, false);
        }
      }, true);
      if (userId) refreshAccount().catch(error => notice(message, error.message, true));
    };

    const initCircuitBreaker = () => {
      const form = document.querySelector(".circuit-form");
      const summary = document.getElementById("circuit-summary");
      const history = document.getElementById("circuit-history");
      const cooling = document.getElementById("circuit-cooling");
      if (!form) return;
      form.addEventListener("submit", async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!requireUser(summary)) return;
        const values = new FormData(form);
        const symbol = String(values.get("stock") || "NOVA").trim().toUpperCase().split(/[\s·]/)[0];
        const action = String(values.get("action") || "BUY").toUpperCase();
        const quantity = Number(values.get("quantity") || 0);
        const reason = String(values.get("reason") || "");
        const price = PRICE[symbol] || 100;
        const button = form.querySelector('[type="submit"]');
        setBusy(button, true, "Checking trade history…");
        try {
          const data = await api("/api/circuit-breaker", {
            user_id: userId,
            proposed_trade: { symbol, action, quantity, price, reason }
          });
          const result = data.result || {};
          if (summary) summary.textContent = data.explanation?.summary || "Behavioural comparison completed.";
          if (history) history.textContent = "Exchange: " + String(values.get("exchange") || "NSE") + ". " + ((result.flags || []).map(flag => flag.message).join(" ") || "No matching historical pattern was found.");
          if (cooling) cooling.textContent = result.risk_level === "review"
            ? "Review flag detected. Pause and independently reassess your assumptions before deciding."
            : result.risk_level === "notice"
              ? "A historical similarity was found. Review the context and original reasoning."
              : "No configured warning was triggered. This does not establish that the proposed trade is suitable.";
        } catch (error) {
          if (summary) summary.textContent = error.message;
          if (history) history.textContent = "The backend could not complete this analysis.";
          if (cooling) cooling.textContent = "Check your demo login and try again.";
        } finally { setBusy(button, false); }
      }, true);
    };

    const initInvestorDNA = () => {
      const controls = getFeatureControls();
      if (!controls.button) return;
      const run = async () => {
        const panel = resultPanel();
        if (!requireUser(panel)) return;
        setBusy(controls.button, true, "Analysing saved trades…");
        try {
          const data = await api("/api/investor-dna?user_id=" + userId);
          const r = data.result || {};
          const controls = getFeatureControls();
          const selfDescription = [
            "Self-described risk style: " + (controls.byLabel("Risk style")?.value || "Not supplied"),
            "Self-described bias: " + (controls.byLabel("Bias")?.value || "Not supplied"),
            "User note: " + (controls.byLabel("Summary")?.value || "Not supplied")
          ];
          const html =
            '<div class="list-stack">' +
            '<div class="list-item"><span>Recorded trades</span><strong>' + esc(r.sample_size || 0) + '</strong></div>' +
            '<div class="list-item"><span>Buy / sell orders</span><strong>' + esc(r.buy_count || 0) + ' / ' + esc(r.sell_count || 0) + '</strong></div>' +
            '<div class="list-item"><span>Average buy value</span><strong>' + money(r.average_buy_value) + '</strong></div>' +
            '<div class="list-item"><span>Average holding period</span><strong>' + (r.average_holding_days == null ? "Not enough data" : esc(r.average_holding_days + " days")) + '</strong></div>' +
            '<div class="list-item"><span>Realised P&amp;L</span><strong>' + money(r.realised_pnl) + '</strong></div>' +
            '<div class="list-item"><span>Most traded symbol</span><strong>' + esc(r.most_traded_symbol || "Not enough data") + '</strong></div>' +
            '<div class="list-item"><span>Momentum-language buys</span><strong>' + esc(r.impulse_buy_count || 0) + '</strong></div></div>' +
            '<h4 style="margin-top:16px">Your self-description</h4><ul class="risk-list">' + findingsHtml(selfDescription) + '</ul>';
          renderGeneric(data, html, "Based on " + (r.sample_size || 0) + " saved trades");
        } catch (error) { renderPanel(resultHeading("Analysis unavailable", error.message)); }
        finally { setBusy(controls.button, false); }
      };
      controls.button.addEventListener("click", run);
      run();
    };

    const initOtherFeature = () => {
      const controls = getFeatureControls();
      if (!controls.button) return;
      const run = async () => {
        const panel = resultPanel();
        if (!requireUser(panel)) return;
        const values = controls.inputs;
        const value = label => {
          const input = controls.byLabel(label);
          return input ? input.value.trim() : "";
        };
        let endpoint = "";
        let payload = { user_id: userId };
        let detail = "";
        let pill = "Simulated analysis";
        if (page === "stress_test") {
          endpoint = "/api/stress-test";
          const raw = value("Shock");
          const match = raw.match(/-?\d+(?:\.\d+)?/);
          payload.scenario_change_pct = match ? Number(match[0]) : -8;
          payload.scenario_label = value("Scenario selection");
          payload.assumption = value("Assumption");
          pill = "Hypothetical " + payload.scenario_change_pct + "% scenario";
        } else if (page === "regret_replay") {
          endpoint = "/api/regret-replay";
          payload.trade_type = value("Trade type") || "All sell decisions";
          const lookbackMatch = value("Lookback").match(/\d+/);
          payload.lookback_days = lookbackMatch ? Number(lookbackMatch[0]) : 90;
          payload.review_note = value("Review note");
          pill = payload.trade_type + " · " + payload.lookback_days + " day lookback";
        } else if (page === "hype_radar") {
          endpoint = "/api/hype-radar";
          payload.spike_multiplier = 2;
          payload.theme = value("Theme");
          payload.signal_source = value("Signal source");
          payload.narrative = value("Narrative");
          pill = "Attention spike scan";
        } else if (page === "move_autopsy") {
          endpoint = "/api/move-autopsy";
          payload.symbol = symbolFrom(value("Stock"), "NOVA");
          payload.move_type = value("Move type");
          payload.move_context = value("What happened");
          pill = payload.symbol + " evidence review";
        } else if (page === "bull_bear") {
          endpoint = "/api/bull-vs-bear";
          payload.symbol = symbolFrom(value("Ticker"), "NOVA");
          payload.bull_thesis = value("Bull thesis");
          payload.bear_thesis = value("Bear thesis");
          pill = payload.symbol + " balanced debate";
        } else if (page === "earnings_analysis") {
          endpoint = "/api/earnings-language";
          const quarter = value("Quarter");
          const revenue = value("Revenue");
          const guidance = value("Guidance");
          payload.company = symbolFrom(quarter, "NOVA");
          payload.quarter = quarter;
          payload.transcript_text = [revenue, guidance].filter(Boolean).join(". ");
          pill = "Communication clarity review";
        } else return;

        setBusy(controls.button, true, "Running " + page.replace("_", " ") + "…");
        try {
          const data = await api(endpoint, payload);
          const r = data.result || {};
          if (page === "stress_test") {
            detail = '<p><strong>Scenario:</strong> ' + esc(payload.scenario_label || "Custom shock") + '<br><strong>Assumption:</strong> ' + esc(payload.assumption || "None supplied") + '</p><div class="list-stack">' +
              '<div class="list-item"><span>Current simulated value</span><strong>' + money(r.current_simulated_portfolio_value) + '</strong></div>' +
              '<div class="list-item"><span>Hypothetical value</span><strong>' + money(r.hypothetical_portfolio_value) + '</strong></div>' +
              '<div class="list-item"><span>Hypothetical change</span><strong>' + money(r.hypothetical_change_value) + '</strong></div>' +
              '<div class="list-item"><span>Positions included</span><strong>' + esc((r.positions || []).length) + '</strong></div></div>' +
              ((r.positions || []).length ? '<ul class="risk-list">' + findingsHtml(r.positions.map(p => p.symbol + ": " + p.quantity + " shares at " + money(p.simulated_reference_price) + " → " + money(p.hypothetical_price))) + '</ul>' : '<p>No open holdings with usable simulated reference prices were found. Place a demo trade first.</p>');
            if (r.valid === false) throw new Error("Choose a scenario between -100% and +100%.");
          } else if (page === "regret_replay") {
            detail = '<div class="list-stack"><div class="list-item"><span>Eligible sell decisions</span><strong>' + esc(r.replayed_sell_count || 0) + '</strong></div>' +
              '<div class="list-item"><span>Next-observation difference</span><strong>' + money(r.hypothetical_difference_total) + '</strong></div></div>' +
              '<p><strong>Review note:</strong> ' + esc(payload.review_note || "No note supplied") + '</p>' +
              ((r.replays || []).length ? '<ul class="risk-list">' + findingsHtml(r.replays.map(item => item.symbol + ": sold at " + money(item.sell_price) + "; next sample " + money(item.next_observation_price) + " on " + item.next_observation_date)) + '</ul>' :
              '<p>No saved sell has a later observation in the sample dataset yet. This is expected for recent trades; the tool will not invent hindsight prices.</p>');
          } else if (page === "hype_radar") {
            const symbols = r.symbols || [];
            const spikes = symbols.flatMap(item => (item.spikes || []).map(spike => item.symbol + ": " + spike.spike_multiple + "x mention baseline on " + spike.date));
            detail = '<p><strong>Theme:</strong> ' + esc(payload.theme || "All sample mentions") + ' · <strong>Source:</strong> ' + esc(payload.signal_source || "All") + '</p>' +
              '<div class="list-stack"><div class="list-item"><span>Symbols analysed</span><strong>' + esc(r.symbols_analysed || 0) + '</strong></div>' +
              '<div class="list-item"><span>Attention spikes</span><strong>' + esc(r.spike_count || 0) + '</strong></div></div>' +
              '<ul class="risk-list">' + findingsHtml(spikes.length ? spikes : ["No sample mention spikes crossed the configured threshold."]) + '</ul>';
          } else if (page === "move_autopsy") {
            detail = '<p><strong>Move type:</strong> ' + esc(payload.move_type || "Not specified") + '<br><strong>Context:</strong> ' + esc(payload.move_context || "None supplied") + '</p>' +
              '<div class="list-stack"><div class="list-item"><span>Evidence signals</span><strong>' + esc(r.evidence_count || 0) + '</strong></div>' +
              '<div class="list-item"><span>Symbol</span><strong>' + esc(r.symbol || payload.symbol) + '</strong></div></div>' +
              '<ul class="risk-list">' + findingsHtml((r.drivers || []).map(item => item.finding)) + '</ul>';
          } else if (page === "bull_bear") {
            detail = '<div class="feature-grid" style="margin-top:16px">' +
              '<div class="panel-card"><h4>Bull case</h4><ul class="risk-list">' + findingsHtml(r.bull_case) + '</ul></div>' +
              '<div class="panel-card"><h4>Bear case</h4><ul class="risk-list">' + findingsHtml(r.bear_case) + '</ul></div></div>' +
              '<p class="demo-data-label">' + esc(r.balance_note || "") + '</p>';
          } else if (page === "earnings_analysis") {
            detail = '<div class="list-stack"><div class="list-item"><span>Transcript words</span><strong>' + esc(r.transcript_word_count || 0) + '</strong></div>' +
              '<div class="list-item"><span>Wording flags</span><strong>' + esc(r.flag_count || 0) + '</strong></div></div>' +
              '<ul class="risk-list">' + findingsHtml((r.flags || []).map(flag => '"' + flag.phrase + '" · ' + flag.note)) + '</ul>' +
              '<p class="demo-data-label">' + esc(r.analysis_label || "Phrase matching only") + '</p>';
          }
          renderGeneric(data, detail, pill);
        } catch (error) {
          renderPanel(resultHeading("Analysis unavailable", error.message) + '<p>Check that the Flask server is running and your demo account is signed in.</p>');
        } finally { setBusy(controls.button, false); }
      };
      controls.button.addEventListener("click", run);
      run();
    };

    const initWatchlist = () => {
      const list = document.getElementById("demo-collection-list");
      if (!list) return;
      const section = document.querySelector(".feature-summary");
      if (section && !document.getElementById("watchlist-add-row")) {
        const row = document.createElement("div");
        row.id = "watchlist-add-row";
        row.className = "market-tools";
        row.style.margin = "16px 0";
        row.innerHTML = '<input id="watchlist-symbol-input" type="text" maxlength="20" placeholder="Add symbol (e.g. RELIANCE)" aria-label="Add watchlist symbol"><button id="watchlist-add-button" class="primary-btn" type="button">Add to watchlist</button>';
        section.insertAdjacentElement("afterend", row);
      }
      const render = () => {
        let symbols = [];
        try {
          const raw = localStorage.getItem(WATCHLIST_KEY);
          symbols = raw === null ? ["RELIANCE", "TCS", "INFY"] : JSON.parse(raw);
          if (raw === null) localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols));
        } catch (_) { symbols = ["RELIANCE", "TCS", "INFY"]; }
        if (!symbols.length) {
          list.innerHTML = '<li class="watchlist-item">Your watchlist is empty. Add a symbol above.</li>';
          return;
        }
        list.innerHTML = symbols.map(symbol => {
          const known = PRICE[symbol];
          return '<li class="watchlist-item"><div><strong>' + esc(symbol) + '</strong><br><small>' +
            (known ? "Simulated quote" : "Custom watchlist symbol") + '</small></div><div><strong>' +
            (known ? money(known) : "Quote unavailable") + '</strong></div><button type="button" class="secondary-btn" data-remove-watch="' + esc(symbol) + '">Remove</button></li>';
        }).join("");
        list.querySelectorAll("[data-remove-watch]").forEach(button => button.addEventListener("click", () => {
          const symbol = button.getAttribute("data-remove-watch");
          const current = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
          localStorage.setItem(WATCHLIST_KEY, JSON.stringify(current.filter(item => item !== symbol)));
          render();
        }));
      };
      const add = document.getElementById("watchlist-add-button");
      if (add) add.addEventListener("click", () => {
        const input = document.getElementById("watchlist-symbol-input");
        const symbol = String(input.value || "").trim().toUpperCase();
        if (!symbol) { input.focus(); return; }
        const current = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
        if (!current.includes(symbol)) current.push(symbol);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(current));
        input.value = "";
        render();
      });
      render();
    };

    const initAccountPages = () => {
      if (page === "profile") {
        const panel = document.querySelector(".feature-panel");
        if (!panel) return;
        panel.innerHTML = '<div class="feature-summary"><div><span class="eyebrow">Account</span><h2>Demo profile</h2><p>Your local Verdict AI demo identity and account status.</p></div></div>' +
          '<div class="panel-card"><div class="list-stack">' +
          '<div class="list-item"><span>Display name</span><strong>' + esc(userName) + '</strong></div>' +
          '<div class="list-item"><span>Demo user ID</span><strong>' + (userId || "Not signed in") + '</strong></div>' +
          '<div class="list-item"><span>Account type</span><strong>Guest demo</strong></div>' +
          '<div class="list-item"><span>Data mode</span><strong>Simulated only</strong></div></div>' +
          '<p class="demo-data-label">This prototype uses browser-stored guest identity. It is not secure production authentication.</p>' +
          '<a class="primary-btn" href="/dashboard">Back to dashboard</a></div>';
      }
      if (page === "settings") {
        const panel = document.querySelector(".feature-panel");
        if (!panel) return;
        panel.innerHTML = '<div class="feature-summary"><div><span class="eyebrow">Preferences</span><h2>Settings</h2><p>Manage this browser’s Verdict AI demo preferences.</p></div></div>' +
          '<div class="panel-card"><div class="list-stack">' +
          '<div class="list-item"><span>Appearance</span><strong id="settings-theme-value">' + esc(document.body.getAttribute("data-theme") || "light") + '</strong></div>' +
          '<div class="list-item"><span>Demo identity</span><strong>' + esc(userName) + '</strong></div>' +
          '<div class="list-item"><span>Market data</span><strong>Simulated</strong></div></div>' +
          '<div class="form-row" style="margin-top:18px"><button type="button" id="settings-theme-toggle" class="secondary-btn">Toggle appearance</button><button type="button" id="settings-clear-watchlist" class="secondary-btn">Reset watchlist</button><a href="/login" class="primary-btn" id="settings-exit">Exit demo</a></div>' +
          '<p id="settings-message" class="confirmation-box" aria-live="polite"></p></div>';
        const themeButton = document.getElementById("settings-theme-toggle");
        if (themeButton) themeButton.addEventListener("click", () => {
          const current = document.body.getAttribute("data-theme") || "light";
          const next = current === "dark" ? "light" : "dark";
          const toggle = document.querySelector(".theme-toggle");
          if (toggle) toggle.click();
          else {
            document.body.setAttribute("data-theme", next);
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("verdict-theme", next);
          }
          const value = document.getElementById("settings-theme-value");
          if (value) value.textContent = next;
        });
        const clearButton = document.getElementById("settings-clear-watchlist");
        if (clearButton) clearButton.addEventListener("click", () => {
          localStorage.removeItem(WATCHLIST_KEY);
          notice(document.getElementById("settings-message"), "Watchlist reset to the default demo symbols.", false);
        });
        const exitLink = document.getElementById("settings-exit");
        if (exitLink) exitLink.addEventListener("click", () => {
          localStorage.removeItem("verdict-user-id");
          localStorage.removeItem("verdict-user-name");
          localStorage.removeItem("verdict-demo-mode");
        });
      }
    };

    if (page === "dashboard") initDashboard();
    if (page === "invest") initInvest();
    if (page === "portfolio" && userId) refreshAccount().catch(error => console.warn(error));
    if (["circuit_breaker", "investor_dna", "stress_test", "regret_replay", "hype_radar", "move_autopsy", "bull_bear", "earnings_analysis"].includes(page)) initFeatureWorkspace();
    if (page === "watchlist") initWatchlist();
    if (page === "profile" || page === "settings") initAccountPages();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();