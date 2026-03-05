# Test the holidays API
try {
    Write-Host "Testing holidays API..." -ForegroundColor Green
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/holidays' -UseBasicParsing -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "Success! $($json.data.Count) holidays returned" -ForegroundColor Green
    Write-Host ""
    Write-Host "First 10 holidays:" -ForegroundColor Yellow
    $json.data | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $($_.date): $($_.name) (is_annual: $($_.is_annual))"
    }
    
    # Count upcoming holidays (from today onwards)
    $today = (Get-Date).ToString('yyyy-MM-dd')
    $upcomingCount = @($json.data | Where-Object { $_.date -ge $today }).Count
    Write-Host ""
    Write-Host "Upcoming holidays (from today): $upcomingCount" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
