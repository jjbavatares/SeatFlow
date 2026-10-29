$ErrorActionPreference = 'Stop'
$seatUrl = 'http://127.0.0.1:48765'
$seatReady = $false
try { $response = Invoke-WebRequest -Uri $seatUrl -UseBasicParsing -TimeoutSec 2; $seatReady = $response.StatusCode -eq 200 -and $response.Content -match 'SeatFlow' } catch {}
if (-not $seatReady) {
  $seatNode = Get-Command node -ErrorAction SilentlyContinue
  if (-not $seatNode) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('SeatFlow necessita Node.js per iniciar el servidor local. No cal connexio a Internet per utilitzar-lo.','SeatFlow') | Out-Null
    exit 1
  }
  $seatServer = Join-Path $PSScriptRoot 'server.cjs'
  Start-Process -FilePath $seatNode.Source -ArgumentList ('"' + $seatServer + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
  for ($seatAttempt=0; $seatAttempt -lt 20; $seatAttempt++) {
    Start-Sleep -Milliseconds 200
    try { $response = Invoke-WebRequest -Uri $seatUrl -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200 -and $response.Content -match 'SeatFlow') { $seatReady = $true; break } } catch {}
  }
}
if ($seatReady) { Start-Process $seatUrl } else {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show('No s ha pogut iniciar SeatFlow. El port 48765 pot estar ocupat.','SeatFlow') | Out-Null
}
