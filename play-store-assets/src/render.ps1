param(
  [Parameter(Mandatory=$true)][string]$Html,   # html filename in src/
  [Parameter(Mandatory=$true)][int]$Width,
  [Parameter(Mandatory=$true)][int]$Height,
  [Parameter(Mandatory=$true)][string]$Out,     # output png filename (in assets root)
  [int]$Scale = 1                               # 1 = output is exactly Width x Height (what Play requires)
)
$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root   = "C:\Users\This PC\Desktop\kinhlac\play-store-assets"
$src    = Join-Path $root "src\$Html"
$outp   = Join-Path $root $Out
$uri    = ([System.Uri]$src).AbsoluteUri
if(Test-Path $outp){ Remove-Item $outp }
$argList = @(
  "--headless=new","--no-sandbox","--disable-gpu","--hide-scrollbars",
  "--force-device-scale-factor=$Scale","--window-size=$Width,$Height",
  "--default-background-color=00000000",
  "--screenshot=`"$outp`"","--user-data-dir=`"$env:TEMP\chr_shot`"",$uri
)
$p = Start-Process -FilePath $chrome -ArgumentList $argList -NoNewWindow -PassThru -Wait
Add-Type -AssemblyName System.Drawing
if(Test-Path $outp){
  $img=[System.Drawing.Image]::FromFile($outp)
  "{0}: {1}x{2} ({3:N0} bytes)" -f $Out,$img.Width,$img.Height,(Get-Item $outp).Length
  $img.Dispose()
} else { "FAILED: $Out (exit $($p.ExitCode))" }
