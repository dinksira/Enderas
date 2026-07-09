# Run once in PowerShell AS ADMINISTRATOR (right-click → Run as administrator).
# Allows Expo Go on your phone to reach Metro (:8081) when using WSL2 mirrored networking.
#
#   cd path\to\enderass\mobile
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-wsl-expo-firewall.ps1

$ErrorActionPreference = 'Stop'

Write-Host 'Configuring Hyper-V VM firewall for WSL mirrored mode...' -ForegroundColor Cyan
Set-NetFirewallHyperVVMSetting `
  -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' `
  -DefaultInboundAction Allow

$ruleName = 'Expo Metro 8081'
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existing) {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -LocalPort 8081 `
    -Protocol TCP `
    -Action Allow `
    -Profile Private,Domain | Out-Null
  Write-Host "Created firewall rule: $ruleName" -ForegroundColor Green
} else {
  Write-Host "Firewall rule already exists: $ruleName" -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Done. Restart WSL if you changed .wslconfig:' -ForegroundColor Green
Write-Host '  wsl --shutdown' -ForegroundColor White
Write-Host 'Then reopen your terminal and run: npx expo start -c' -ForegroundColor White
