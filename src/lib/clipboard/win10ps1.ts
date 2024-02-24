// 来自 https://github.com/PicGo/PicGo-Core/blob/dev/src/utils/clipboard/windows10.ps1

export default `
param($imagePath)

[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

Add-Type -Assembly PresentationCore
function main {
    $img = [Windows.Clipboard]::GetImage()

    if ($img -eq $null) {
        "no image"
        Exit 1
    }

    if (-not $imagePath) {
        "no image"
        Exit 1
    }

    $fcb = new-object Windows.Media.Imaging.FormatConvertedBitmap($img, [Windows.Media.PixelFormats]::Rgb24, $null, 0)
    $stream = [IO.File]::Open($imagePath, "OpenOrCreate")
    $encoder = New-Object Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($fcb)) | out-null
    $encoder.Save($stream) | out-null
    $stream.Dispose() | out-null

    $imagePath
    Exit 1
}

try {
    # For WIN10
    $file = Get-Clipboard -Format FileDropList
    if ($file -ne $null) {
        Convert-Path $file
        Exit 1
    }
} catch {
    # For WIN7 WIN8 WIN10
    main
}

main
`
