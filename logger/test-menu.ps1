<#
  Daily Log API Test Terminal (ASCII-only)
  Usage: .\test-menu.ps1 [-BaseUrl http://localhost:3000]

  Notes:
  - Designed for Windows PowerShell 5+ or PowerShell 7+ (pwsh).
  - Avoids emojis to prevent encoding issues in consoles/editors.
#>

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Set-StrictMode -Version Latest

# ----------------- Helpers -----------------
function Write-Success { param([string]$Text) Write-Host $Text -ForegroundColor Green }
function Write-ErrorMsg { param([string]$Text) Write-Host $Text -ForegroundColor Red }
function Write-Info { param([string]$Text) Write-Host $Text -ForegroundColor Cyan }
function Write-WarningMsg { param([string]$Text) Write-Host $Text -ForegroundColor Yellow }

function Pause-Enter {
    Read-Host "`nPress Enter to continue"
}

function Show-JsonResult {
    param($Result)
    if ($null -ne $Result) {
        try {
            $json = $Result | ConvertTo-Json -Depth 10
            Write-Host $json -ForegroundColor White
        }
        catch {
            ($Result | Out-String) | ForEach-Object { Write-Host $_ -ForegroundColor White }
        }
    }
}

function Invoke-ApiCall {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")][string]$Method = "GET",
        [string]$Body = $null
    )
    try {
        Write-Info "Request: $Method $Uri"
        if ($Body) { Write-Info "Body: $Body" }

        $params = @{ Uri = $Uri; Method = $Method; ErrorAction = 'Stop' }
        if ($Body) { $params.Body = $Body; $params.ContentType = 'application/json' }

        $result = Invoke-RestMethod @params
        Write-Success "Success"
        Show-JsonResult $result
        return $result
    }
    catch {
        $msg = $_.Exception.Message
        $resp = $_.Exception.Response
        if ($resp -and ($resp -is [System.Net.HttpWebResponse])) {
            $code = [int]$resp.StatusCode
            $status = $resp.StatusDescription
            Write-ErrorMsg "Error ($code $status): $msg"
        }
        else {
            Write-ErrorMsg "Error: $msg"
        }
        return $null
    }
}

# ----------------- Menus -----------------
function Show-MainMenu {
    Clear-Host
    Write-Host @"
+------------------------------------------------------+
|            DAILY LOG API TEST TERMINAL               |
|                    PowerShell UI                     |
+------------------------------------------------------+
| 1. System Status (Connectivity)                      |
| 2. Log Operations (Upsert Tests)                     |
| 3. Data Viewer (Queries)                             |
| 4. Bulk Operations                                   |
| 5. Performance Tests                                 |
| 6. Database Maintenance                              |
| 7. Advanced Scenarios                                |
| 0. Exit                                              |
+------------------------------------------------------+
"@
}

function Show-SystemMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                    SYSTEM STATUS                     |
+------------------------------------------------------+
  1. App Connectivity Test
  2. MongoDB Connectivity Test
  3. System Info
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host "Select"
        switch ($choice) {
            '1' {
                Write-Info "Testing app connectivity..."
                Invoke-ApiCall "$BaseUrl"
                Pause-Enter
            }
            '2' {
                Write-Info "Testing MongoDB connectivity..."
                Invoke-ApiCall "$BaseUrl/daily-logs/api/test-connection"
                Pause-Enter
            }
            '3' {
                Write-Info "Fetching system info..."
                Invoke-ApiCall "$BaseUrl/daily-log-info"
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg "Invalid choice" }
        }
    } while ($true)
}

function Show-LogMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                     LOG OPERATIONS                   |
+------------------------------------------------------+
  1. Add Simple Log (Today)
  2. Add Categorized Log
  3. Add Log with Metadata
  4. Add Log for Specific Date
  5. Test All Levels (info/warn/error/debug)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host "Select"
        switch ($choice) {
            '1' {
                $body = @{ level = 'info'; message = "Test log - $(Get-Date -Format 'HH:mm:ss')"; source = 'terminal-app' } | ConvertTo-Json
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body
                Pause-Enter
            }
            '2' {
                $categories = @('system', 'auth', 'api', 'database', 'security')
                $category = $categories | Get-Random
                $body = @{ level = 'warn'; message = "Category test: $category"; category = $category; source = 'terminal-app' } | ConvertTo-Json
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body
                Pause-Enter
            }
            '3' {
                $body = @{
                    level    = 'error'
                    message  = 'Detailed error log'
                    category = 'application'
                    source   = 'terminal-app'
                    metadata = @{ errorCode = 'ERR001'; userId = 'test-user-123'; timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); severity = 'high' }
                } | ConvertTo-Json -Depth 6
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body
                Pause-Enter
            }
            '4' {
                $targetDate = Read-Host "Date (yyyy-MM-dd) or Enter for today"
                $payload = @{ level = 'debug'; message = 'Custom date log'; category = 'scheduled'; source = 'terminal-app' }
                if (-not [string]::IsNullOrWhiteSpace($targetDate)) { $payload.targetDate = $targetDate }
                $json = $payload | ConvertTo-Json
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $json
                Pause-Enter
            }
            '5' {
                $levels = @('info', 'warn', 'error', 'debug')
                foreach ($lvl in $levels) {
                    $body = @{ level = $lvl; message = "Level test: $($lvl.ToUpper())"; category = 'test'; source = 'terminal-app' } | ConvertTo-Json
                    Write-Host ("  -> Adding {0}" -f $lvl.ToUpper())
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body | Out-Null
                    Start-Sleep -Milliseconds 300
                }
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg "Invalid choice" }
        }
    } while ($true)
}

function Show-DataMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                      DATA VIEWER                     |
+------------------------------------------------------+
  1. Show Today's Logs
  2. Show Logs by Date
  3. List All Days
  4. Today's Stats
  5. Global Stats
  6. Search Logs (by message)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host "Select"
        switch ($choice) {
            '1' {
                Write-Info 'Fetching today logs...'
                Invoke-ApiCall "$BaseUrl/daily-logs"
                Pause-Enter
            }
            '2' {
                $date = Read-Host 'Date (yyyy-MM-dd)'
                if (-not [string]::IsNullOrWhiteSpace($date)) {
                    Write-Info "Fetching logs for $date..."
                    Invoke-ApiCall "$BaseUrl/daily-logs/date/$date"
                }
                Pause-Enter
            }
            '3' {
                Write-Info 'Listing all days...'
                Invoke-ApiCall "$BaseUrl/daily-logs/api/dates"
                Pause-Enter
            }
            '4' {
                $today = (Get-Date).ToString('yyyy-MM-dd')
                Write-Info "Today's stats..."
                Invoke-ApiCall "$BaseUrl/daily-logs/api/stats/$today"
                Pause-Enter
            }
            '5' {
                Write-Info 'Global stats...'
                Invoke-ApiCall "$BaseUrl/daily-logs/api/stats"
                Pause-Enter
            }
            '6' {
                $term = Read-Host 'Search term'
                if (-not [string]::IsNullOrWhiteSpace($term)) {
                    $encoded = [uri]::EscapeDataString($term)
                    Invoke-ApiCall "$BaseUrl/daily-logs/api/search?message=$encoded"
                }
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg 'Invalid choice' }
        }
    } while ($true)
}

function Show-BulkMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                    BULK OPERATIONS                   |
+------------------------------------------------------+
  1. Add 5 Logs
  2. Add 10 Logs (Distinct Categories)
  3. Add Random Set (8 mixed logs)
  4. Generate Test Data (20 logs)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host 'Select'
        switch ($choice) {
            '1' {
                1..5 | ForEach-Object {
                    $body = @{ level = 'info'; message = "Bulk test log $_"; category = 'bulk-test'; source = 'terminal-app' } | ConvertTo-Json
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body | Out-Null
                    Start-Sleep -Milliseconds 150
                }
                Write-Success 'Added 5 logs.'
                Pause-Enter
            }
            '2' {
                $categories = @('system', 'auth', 'api', 'database', 'security', 'network', 'cache', 'queue', 'notification', 'file')
                for ($i = 0; $i -lt 10; $i++) {
                    $body = @{ level = 'info'; message = "Category: $($categories[$i])"; category = $categories[$i]; source = 'terminal-app' } | ConvertTo-Json
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body | Out-Null
                    Start-Sleep -Milliseconds 150
                }
                Write-Success 'Added 10 category logs.'
                Pause-Enter
            }
            '3' {
                $levels = @('info', 'warn', 'error', 'debug')
                $categories = @('system', 'auth', 'api', 'database')
                1..8 | ForEach-Object {
                    $payload = @{ level = $levels | Get-Random; message = "Random test $_"; category = $categories | Get-Random; source = 'terminal-app'; metadata = @{ testId = "RAND$_"; timestamp = (Get-Date).ToString('o') } }
                    $json = $payload | ConvertTo-Json -Depth 6
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $json | Out-Null
                    Start-Sleep -Milliseconds 150
                }
                Write-Success 'Random set added.'
                Pause-Enter
            }
            '4' {
                1..20 | ForEach-Object {
                    $body = @{ level = (@('info', 'warn', 'error', 'debug') | Get-Random); message = "Seed log $_"; category = (@('test', 'mock', 'sample') | Get-Random); source = 'terminal-app' } | ConvertTo-Json
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body | Out-Null
                    Start-Sleep -Milliseconds 100
                }
                Write-Success 'Generated 20 test logs.'
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg 'Invalid choice' }
        }
    } while ($true)
}

function Start-PerformanceTest {
    param(
        [Parameter(Mandatory = $true)][int]$Count,
        [Parameter(Mandatory = $true)][string]$Label
    )
    Write-Info "Starting performance test: $Label ($Count logs)"
    $start = Get-Date
    for ($i = 1; $i -le $Count; $i++) {
        $body = @{
            level    = (@('info', 'warn', 'error', 'debug') | Get-Random)
            message  = "Perf log $i"
            category = 'performance'
            source   = 'perf-test'
            metadata = @{ testRun = $Label; logNumber = $i; totalLogs = $Count }
        } | ConvertTo-Json -Depth 6
        Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $body | Out-Null
        if (($i % 10) -eq 0) { Write-Host ("  -> {0}/{1}" -f $i, $Count) -ForegroundColor Gray }
    }
    $end = Get-Date
    $duration = ($end - $start)
    $rate = if ($duration.TotalSeconds -gt 0) { [math]::Round($Count / $duration.TotalSeconds, 2) } else { $Count }
    Write-Success "Completed: $Label"
    Write-Info ("Duration: {0:N2}s" -f $duration.TotalSeconds)
    Write-Info ("Throughput: {0} logs/sec" -f $rate)
    Pause-Enter
}

function Show-PerformanceMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                   PERFORMANCE TESTS                  |
+------------------------------------------------------+
  1. Quick (10 logs)
  2. Medium (100 logs)
  3. Stress (1000 logs)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host 'Select'
        switch ($choice) {
            '1' { Start-PerformanceTest -Count 10  -Label 'Quick' }
            '2' { Start-PerformanceTest -Count 100 -Label 'Medium' }
            '3' { Start-PerformanceTest -Count 1000 -Label 'Stress' }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg 'Invalid choice' }
        }
    } while ($true)
}

function Show-DatabaseMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                 DATABASE MAINTENANCE                 |
+------------------------------------------------------+
  1. Clear Today's Logs (DELETE /daily-logs)
  2. Clear Logs By Date (DELETE /daily-logs/date/:date)
  3. Clear ALL Logs (DELETE /daily-logs/api/clear-all)
  4. Ensure Container (POST /daily-logs/ensure-container)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host 'Select'
        switch ($choice) {
            '1' {
                $confirm = Read-Host 'Delete today logs? (y/n)'
                if ($confirm -eq 'y') { Invoke-ApiCall "$BaseUrl/daily-logs" 'DELETE' }
                Pause-Enter
            }
            '2' {
                $date = Read-Host 'Date to delete (yyyy-MM-dd)'
                if (-not [string]::IsNullOrWhiteSpace($date)) {
                    $confirm = Read-Host "Delete logs for $date? (y/n)"
                    if ($confirm -eq 'y') { Invoke-ApiCall "$BaseUrl/daily-logs/date/$date" 'DELETE' }
                }
                Pause-Enter
            }
            '3' {
                $a = Read-Host 'Delete ALL logs? (type YES to confirm)'
                if ($a -eq 'YES') { Invoke-ApiCall "$BaseUrl/daily-logs/api/clear-all" 'DELETE' }
                Pause-Enter
            }
            '4' {
                $date = Read-Host 'Container date (yyyy-MM-dd) or Enter for today'
                $payload = @{}
                if (-not [string]::IsNullOrWhiteSpace($date)) { $payload.date = $date }
                $json = $payload | ConvertTo-Json
                Invoke-ApiCall "$BaseUrl/daily-logs/ensure-container" 'POST' $json
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg 'Invalid choice' }
        }
    } while ($true)
}

function Show-AdvancedMenu {
    do {
        Clear-Host
        Write-Host @"
+------------------------------------------------------+
|                   ADVANCED SCENARIOS                 |
+------------------------------------------------------+
  1. Mixed Set (15 logs, random levels/categories, optional metadata)
  2. Error Scenarios (empty message / invalid level / long message)
  3. Custom Scenario (yesterday + nested metadata)
  9. Back to Main Menu
  0. Exit
"@
        $choice = Read-Host 'Select'
        switch ($choice) {
            '1' {
                $levels = @('info', 'warn', 'error', 'debug')
                $categories = @('system', 'auth', 'api', 'database', 'security')
                1..15 | ForEach-Object {
                    $hasMeta = (Get-Random -Minimum 0 -Maximum 2) -eq 1
                    $payload = @{ level = $levels | Get-Random; category = $categories | Get-Random; message = "Mixed test $_"; source = 'advanced-test' }
                    if ($hasMeta) { $payload.metadata = @{ testId = "ADV$_"; timestamp = (Get-Date).ToString('o'); complexity = 'high' } }
                    $json = $payload | ConvertTo-Json -Depth 6
                    Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' $json | Out-Null
                    Start-Sleep -Milliseconds 150
                }
                Write-Success 'Mixed set complete.'
                Pause-Enter
            }
            '2' {
                Write-Info 'Running error scenarios...'
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' (@{ level = 'error'; message = ''; source = 'error-test' } | ConvertTo-Json)
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' (@{ level = 'invalid'; message = 'Invalid level test'; source = 'error-test' } | ConvertTo-Json)
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' (@{ level = 'info'; message = ('x' * 1000); source = 'error-test' } | ConvertTo-Json)
                Pause-Enter
            }
            '3' {
                $yesterday = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd')
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' (@{ level = 'info'; message = 'From yesterday'; category = 'custom'; source = 'custom-test'; targetDate = $yesterday } | ConvertTo-Json)
                Invoke-ApiCall "$BaseUrl/daily-logs/add-log" 'POST' (@{ level = 'warn'; message = 'Custom metadata log'; category = 'custom'; source = 'custom-test'; metadata = @{ customField1 = 'value1'; customField2 = 42; customField3 = @{ nested = 'value' } } } | ConvertTo-Json -Depth 6)
                Pause-Enter
            }
            '9' { return }
            '0' { exit }
            default { Write-WarningMsg 'Invalid choice' }
        }
    } while ($true)
}

# ----------------- App Entry -----------------
function Start-TestMenu {
    Write-Host "Daily Log API Test Terminal" -ForegroundColor Green
    Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray

    try {
        Invoke-RestMethod -Uri $BaseUrl -Method GET -ErrorAction Stop | Out-Null
        Write-Success 'Connectivity OK'
    }
    catch {
        Write-ErrorMsg "Connectivity failed: $BaseUrl"
        Write-WarningMsg 'Ensure the backend is running before testing.'
    }

    do {
        Show-MainMenu
        $choice = Read-Host 'Your choice'
        switch ($choice) {
            '1' { Show-SystemMenu }
            '2' { Show-LogMenu }
            '3' { Show-DataMenu }
            '4' { Show-BulkMenu }
            '5' { Show-PerformanceMenu }
            '6' { Show-DatabaseMenu }
            '7' { Show-AdvancedMenu }
            '0' { Write-Success 'Bye'; exit }
            default { Write-WarningMsg 'Invalid choice (enter 0-7)'; Start-Sleep -Milliseconds 700 }
        }
    } while ($true)
}

# Auto-run when executed (not dot-sourced)
if ($MyInvocation.InvocationName -ne '.') {
    Start-TestMenu
}
