# Usa el mismo glifo MaterialCommunityIcons que la biblioteca de LibroTrack.
# Ejecutar desde Windows: powershell -File scripts/generate-app-icons.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$iconsRoot = Join-Path $projectRoot 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons'
$glyphs = Get-Content -LiteralPath (Join-Path $iconsRoot 'glyphmaps/MaterialCommunityIcons.json') -Raw | ConvertFrom-Json
$glyph = [char]::ConvertFromUtf32($glyphs.'book-open-page-variant')
$fontCollection = [System.Drawing.Text.PrivateFontCollection]::new()
$fontCollection.AddFontFile((Join-Path $iconsRoot 'Fonts/MaterialCommunityIcons.ttf'))

function Write-AppIcon([string]$name, [string]$background, [string]$foreground, [int]$glyphSize, [int]$outputSize = 1024) {
    $bitmap = [System.Drawing.Bitmap]::new(1024, 1024)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $font = [System.Drawing.Font]::new($fontCollection.Families[0], $glyphSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($foreground))
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    try {
        $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($background))
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $graphics.DrawString($glyph, $font, $brush, [System.Drawing.RectangleF]::new(0, 0, 1024, 1024), $format)
        $destination = Join-Path $projectRoot "assets/$name.png"
        if ($outputSize -eq 1024) {
            $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
        } else {
            $scaled = [System.Drawing.Bitmap]::new($outputSize, $outputSize)
            $scaledGraphics = [System.Drawing.Graphics]::FromImage($scaled)
            try {
                $scaledGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $scaledGraphics.DrawImage($bitmap, 0, 0, $outputSize, $outputSize)
                $scaled.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $scaledGraphics.Dispose()
                $scaled.Dispose()
            }
        }
    } finally {
        $format.Dispose()
        $brush.Dispose()
        $font.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    Write-AppIcon 'librotrack-icon' '#8B3A3A' '#F7F4EF' 640
    Write-AppIcon 'librotrack-adaptive' 'Transparent' '#F7F4EF' 460
    Write-AppIcon 'librotrack-monochrome' 'Transparent' '#FFFFFF' 460
    Write-AppIcon 'librotrack-favicon' '#8B3A3A' '#F7F4EF' 640 48
} finally {
    $fontCollection.Dispose()
}
