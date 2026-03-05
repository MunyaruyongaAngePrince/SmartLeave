@echo off
REM Test the holidays API
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/holidays' -UseBasicParsing; if ($response.StatusCode -eq 200) { $json = $response.Content | ConvertFrom-Json; Write-Host 'SUCCESS! Holidays count: ' $json.data.Count -ForegroundColor Green; $json.data | Select-Object -First 5 | ConvertTo-Json | Write-Host } else { Write-Host 'ERROR: Status ' $response.StatusCode -ForegroundColor Red } } catch { Write-Host 'ERROR: ' $_.Exception.Message -ForegroundColor Red }"
