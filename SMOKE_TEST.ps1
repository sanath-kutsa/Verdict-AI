$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:5000"

Write-Host ""
Write-Host "VERDICT AI API SMOKE TEST" -ForegroundColor Cyan
Write-Host "Checking local backend..."
$health = Invoke-RestMethod "$base/api/health"
if ($health.status -ne "ok") { throw "Verdict AI backend is not ready." }
Write-Host "Analysis mode: $($health.analysis_mode)"
Write-Host "Creating an isolated local paper-trading account..."

$guest = Invoke-RestMethod -Uri "$base/api/users/guest" -Method Post -ContentType "application/json" -Body '{"name":"Verdict AI Smoke Test"}'
$userId = $guest.user.id

# Backdated simulated trades let Regret Replay compare the sell with later
# observations already present in the fictional NOVA price-history dataset.
$buy = @{
    symbol = "NOVA"
    action = "BUY"
    quantity = 2
    price = 100
    date = "2026-10-01"
    reason = "Planned sample entry"
} | ConvertTo-Json

$sell = @{
    symbol = "NOVA"
    action = "SELL"
    quantity = 1
    price = 110
    date = "2026-10-20"
    reason = "Planned partial exit"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$base/api/users/$userId/trades" -Method Post -ContentType "application/json" -Body $buy | Out-Null
Invoke-RestMethod -Uri "$base/api/users/$userId/trades" -Method Post -ContentType "application/json" -Body $sell | Out-Null

$portfolio = Invoke-RestMethod "$base/api/users/$userId/portfolio"
$dnaBody = @{ user_id = $userId; risk_style = "Moderate"; bias = "FOMO / momentum chasing"; goal = "Long-term wealth creation"; user_note = "I sometimes buy after a sharp price rise." } | ConvertTo-Json
$dna = Invoke-RestMethod -Uri "$base/api/investor-dna" -Method Post -ContentType "application/json" -Body $dnaBody

$circuitBody = @{
    user_id = $userId
    proposed_trade = @{
        symbol = "NOVA"
        action = "BUY"
        quantity = 1
        price = 133.56
        reason = "FOMO after breakout and trending online"
        emotional_state = "Excited"
        confidence = "Very high"
    }
} | ConvertTo-Json -Depth 6
$circuit = Invoke-RestMethod -Uri "$base/api/circuit-breaker" -Method Post -ContentType "application/json" -Body $circuitBody

$stressBody = @{ user_id = $userId; symbol = "NOVA"; quantity = 10; current_price = 1000; scenario_change_pct = -20; assumption = "Broad market sell-off" } | ConvertTo-Json
$stress = Invoke-RestMethod -Uri "$base/api/stress-test" -Method Post -ContentType "application/json" -Body $stressBody

$regretBody = @{ user_id = $userId; trade_type = "All sell decisions"; lookback_days = 365; review_note = "Review the partial exit." } | ConvertTo-Json
$regret = Invoke-RestMethod -Uri "$base/api/regret-replay" -Method Post -ContentType "application/json" -Body $regretBody

$hypeBody = @{ user_id = $userId; spike_multiplier = 2; theme = "AI infrastructure"; signal_source = "Social media"; narrative = "Everyone is buying because returns are guaranteed, but valuation and competition remain risks." } | ConvertTo-Json
$hype = Invoke-RestMethod -Uri "$base/api/hype-radar" -Method Post -ContentType "application/json" -Body $hypeBody

$moveBody = @{ user_id = $userId; symbol = "NOVA"; move_type = "Breakout"; price_change_pct = 5; volume_multiple = 2.1; catalyst = "Quarterly results"; move_context = "Price rose after results on higher-than-average volume." } | ConvertTo-Json
$move = Invoke-RestMethod -Uri "$base/api/move-autopsy" -Method Post -ContentType "application/json" -Body $moveBody

$bullBearBody = @{ user_id = $userId; symbol = "NOVA"; horizon = "1 to 3 years"; bull_thesis = "AI demand could expand revenue."; bear_thesis = "Valuation and margin pressure may limit returns." } | ConvertTo-Json
$bullBear = Invoke-RestMethod -Uri "$base/api/bull-vs-bear" -Method Post -ContentType "application/json" -Body $bullBearBody

$earningsBody = @{ user_id = $userId; company = "NOVA"; quarter = "Q2 FY2026"; transcript_text = "Revenue increased by 25 percent. Net profit increased by 8 percent. Management expects demand to remain strong, but costs could affect margins." } | ConvertTo-Json
$earnings = Invoke-RestMethod -Uri "$base/api/earnings-language" -Method Post -ContentType "application/json" -Body $earningsBody

foreach ($response in @($dna, $circuit, $stress, $regret, $hype, $move, $bullBear, $earnings)) {
    if ($response.analysis_mode -ne "local_rule_based_and_deterministic") { throw "A feature did not return local analysis mode." }
}
if ($dna.result.self_assessment.risk_style -ne "Moderate") { throw "Investor DNA did not return the submitted risk style." }
if ($circuit.result.proposed_trade.emotional_state -ne "Excited") { throw "Circuit Breaker did not return the submitted emotional state." }
if ($stress.result.positions.Count -ne 1 -or $stress.result.positions[0].symbol -ne "NOVA" -or $stress.result.hypothetical_change_pct -ne -20) { throw "Stress Test did not use the submitted symbol, quantity, price, and shock." }
if ($regret.result.filters.review_note -ne "Review the partial exit.") { throw "Regret Replay did not return the review note." }
if ($hype.result.theme -ne "AI infrastructure" -or $hype.result.narrative_analysis.promotional_terms -notcontains "guaranteed") { throw "Hype Radar did not analyse the submitted narrative." }
if (-not ($move.result.drivers | Where-Object { $_.category -eq "user_supplied_context" })) { throw "Move Autopsy did not include submitted context." }
if ($bullBear.result.investment_horizon -ne "1 to 3 years") { throw "Bull vs Bear did not return the investment horizon." }
if ($earnings.result.transcript_word_count -le 0) { throw "Earnings Analysis did not analyse the submitted transcript." }

Write-Host ""
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "[PASS] Guest account + SQLite trades: user #$userId, $($portfolio.trade_count) trades, cash $($portfolio.cash_balance)"
Write-Host "[PASS] 1. Investor DNA: $($dna.result.sample_size) trades analysed"
Write-Host "[PASS] 2. Circuit Breaker: $($circuit.result.risk_level), $($circuit.result.flags.Count) flag(s)"
Write-Host "[PASS] 3. Stress Test: $($stress.result.positions.Count) position(s), hypothetical change $($stress.result.hypothetical_change_pct)%"
Write-Host "[PASS] 4. Regret Replay: $($regret.result.replayed_sell_count) eligible sell(s)"
Write-Host "[PASS] 5. Hype Radar: $($hype.result.symbols_analysed) symbol(s), $($hype.result.spike_count) spike(s)"
Write-Host "[PASS] 6. Move Autopsy: $($move.result.symbol), $($move.result.evidence_count) evidence item(s)"
Write-Host "[PASS] 7. Bull vs Bear: $($bullBear.result.bull_case.Count) bull point(s), $($bullBear.result.bear_case.Count) bear point(s)"
Write-Host "[PASS] 8. Earnings Language: $($earnings.result.flag_count) wording flag(s)"
Write-Host ""
Write-Host "Smoke test completed. All eight workflows returned local analysis; bundled market history remains illustrative sample data." -ForegroundColor Green
Write-Host "Test account ID: $userId (safe to leave in the local demo database)."
