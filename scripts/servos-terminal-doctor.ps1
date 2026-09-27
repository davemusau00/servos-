param(
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

function Try-Value([scriptblock]$Block) {
    try { & $Block } catch { $null }
}

$os = Try-Value { Get-CimInstance Win32_OperatingSystem }
$computer = Try-Value { Get-CimInstance Win32_ComputerSystem }
$systemDrive = Try-Value { Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$($env:SystemDrive)'" }
$timezone = Try-Value { Get-TimeZone }
$printers = Try-Value { Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus }
$adapters = Try-Value { Get-NetAdapter | Where-Object Status -eq "Up" | Select-Object Name, InterfaceDescription, LinkSpeed, MacAddress }
$power = Try-Value { (powercfg /GETACTIVESCHEME 2>$null | Out-String).Trim() }

$ramGb = if ($computer) { [math]::Round($computer.TotalPhysicalMemory / 1GB, 2) } else { $null }
$freeGb = if ($systemDrive) { [math]::Round($systemDrive.FreeSpace / 1GB, 2) } else { $null }
$utcOffset = [TimeZoneInfo]::Local.GetUtcOffset([DateTime]::Now).TotalHours

$checks = [ordered]@{
    Is64BitOS = [Environment]::Is64BitOperatingSystem
    RamAtLeast4GB = if ($ramGb -ne $null) { $ramGb -ge 4 } else { $null }
    FreeDiskAtLeast5GB = if ($freeGb -ne $null) { $freeGb -ge 5 } else { $null }
    NairobiUtcOffset = ($utcOffset -eq 3)
    PrintSpoolerRunning = ((Try-Value { (Get-Service Spooler).Status.ToString() }) -eq "Running")
}

$report = [ordered]@{
    GeneratedAt = (Get-Date).ToString("o")
    Mode = "READ_ONLY_TERMINAL_DOCTOR"
    ComputerName = $env:COMPUTERNAME
    OS = if ($os) { "$($os.Caption) $($os.Version)" } else { $null }
    Architecture = $env:PROCESSOR_ARCHITECTURE
    RamGB = $ramGb
    SystemDriveFreeGB = $freeGb
    TimeZone = if ($timezone) { $timezone.Id } else { $null }
    UtcOffsetHours = $utcOffset
    ActivePowerScheme = $power
    Printers = @($printers)
    ActiveNetworkAdapters = @($adapters)
    Checks = $checks
    OverallPass = -not ($checks.Values -contains $false)
    Note = "Read-only diagnostic. It changes no Windows, ServOS, printer, network or power settings."
}

$json = $report | ConvertTo-Json -Depth 8
if ($OutputPath) {
    $resolved = [IO.Path]::GetFullPath($OutputPath)
    [IO.File]::WriteAllText($resolved, $json, [Text.UTF8Encoding]::new($false))
    Write-Host "ServOS terminal doctor report: $resolved"
}
$json
