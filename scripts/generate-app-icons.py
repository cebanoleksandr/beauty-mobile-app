#!/usr/bin/env python3
"""
Generates the Android launcher icons and the iOS AppIcon set from one design:
the web app's "slots" logo (frontend/public/logo.svg) — a 3×3 grid of slots
with the centre one lit and a sparkle — in this app's palette.

Requires ImageMagick (`convert`). Run from the app root:
    python3 scripts/generate-app-icons.py

Writes assets/icon/app-icon.svg (the source, for reference), the in-app header logo
(src/assets/icons/app-logo.svg) and every PNG.
"""
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android/app/src/main/res')
IOS = os.path.join(ROOT, 'ios/slotsy_mobile_app/Images.xcassets/AppIcon.appiconset')

# Palette (src/theme): background, neutral button, primary, primary container, secondary.
BG = '#0E0E11'
TILE = '#2A2A2D'
SLOT_TOP = '#FFD2C1'
SLOT_BOTTOM = '#E8B4A0'
SLOT_EDGE = '#B98672'
SPARKLE = '#CEBDFF'

TILES = [(86, 86), (208, 86), (330, 86), (86, 208), (330, 208), (86, 330), (208, 330), (330, 330)]
SPARKLE_PATH = 'M300 172 C303 190 306 193 324 196 C306 199 303 202 300 220 C297 202 294 199 276 196 C294 193 297 190 300 172 Z'


def art(mono=False):
    """The logo artwork (512×512 user space), without background."""
    # Themed (monochrome) icons only use alpha: dim the idle slots so the lit one stands out.
    tile = '#FFFFFF66' if mono else TILE
    tiles = ''.join(f'<rect x="{x}" y="{y}" width="96" height="96" rx="22" fill="{tile}"/>' for x, y in TILES)
    if mono:
        slot = '<rect x="208" y="204" width="96" height="96" rx="22" fill="#FFFFFF"/>'
        sparkle = f'<path d="{SPARKLE_PATH}" fill="#FFFFFF"/>'
    else:
        slot = (
            f'<rect x="208" y="214" width="96" height="96" rx="22" fill="{SLOT_EDGE}"/>'
            '<rect x="208" y="204" width="96" height="96" rx="22" fill="url(#slot)"/>'
        )
        sparkle = f'<path d="{SPARKLE_PATH}" fill="{SPARKLE}"/>'
    return tiles + slot + sparkle


DEFS = (
    '<defs><linearGradient id="slot" x1="0" y1="0" x2="1" y2="1">'
    f'<stop offset="0" stop-color="{SLOT_TOP}"/><stop offset="1" stop-color="{SLOT_BOTTOM}"/>'
    '</linearGradient></defs>'
)


def svg(content, size=512, view=(0, 0, 512, 512)):
    vb = ' '.join(map(str, view))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{vb}">{DEFS}{content}</svg>'


def render(svg_text, out, size, glow=None, bg=None, mask=None):
    """Rasterises at 4× and downsamples (antialiasing); optionally composites a blurred glow underneath."""
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'icon.svg')
        open(src, 'w').write(svg_text)
        big = size * 4
        layers = os.path.join(tmp, 'art.png')
        subprocess.run(['convert', '-background', 'none', '-density', '384', src, '-resize', f'{big}x{big}!', layers], check=True)
        if glow:
            gsrc = os.path.join(tmp, 'glow.svg')
            open(gsrc, 'w').write(glow)
            gpng = os.path.join(tmp, 'glow.png')
            sigma = max(2, big // 40)
            subprocess.run(
                ['convert', '-background', 'none', '-density', '384', gsrc, '-resize', f'{big}x{big}!',
                 '-channel', 'A', '-blur', f'0x{sigma}', '+channel', gpng],
                check=True,
            )
            # Glow goes above the background but below the artwork.
            base = os.path.join(tmp, 'base.png')
            if bg:
                subprocess.run(['convert', '-size', f'{big}x{big}', f'xc:{bg}', gpng, '-composite', base], check=True)
            else:
                os.rename(gpng, base)
            subprocess.run(['convert', base, layers, '-composite', layers], check=True)
        elif bg:
            subprocess.run(['convert', '-size', f'{big}x{big}', f'xc:{bg}', layers, '-composite', layers], check=True)
        if mask:
            # Launcher shape as an alpha mask (ImageMagick's SVG renderer ignores clipPath).
            m = os.path.join(tmp, 'mask.png')
            subprocess.run(['convert', '-size', f'{big}x{big}', 'xc:none', '-fill', 'white', '-draw', mask(big), m], check=True)
            subprocess.run(['convert', layers, '-alpha', 'set', m, '-compose', 'DstIn', '-composite', layers], check=True)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        args = ['convert', layers, '-resize', f'{size}x{size}', '-strip']
        if bg and not mask:
            args += ['-alpha', 'off']  # opaque (required for the iOS App Store icon)
        subprocess.run(args + [out], check=True)


def glow_svg(view=(0, 0, 512, 512)):
    return svg(f'<rect x="200" y="196" width="112" height="112" rx="28" fill="{SLOT_BOTTOM}" opacity="0.6"/>', view=view)


def rounded_square(px):
    r = px * 112 // 512
    return f'roundrectangle 0,0 {px - 1},{px - 1} {r},{r}'


def circle(px):
    c = px // 2
    return f'circle {c},{c} {c},0'


def main():
    # Reference source (rounded, like the web logo).
    open(os.path.join(ROOT, 'assets/icon/app-icon.svg'), 'w').write(
        svg(f'<rect width="512" height="512" rx="120" fill="{BG}"/>{art()}') + '\n'
    )
    # In-app logo (headers): same artwork, 32×32 (react-native-svg sizes by the root attributes).
    open(os.path.join(ROOT, 'src/assets/icons/app-logo.svg'), 'w').write(
        svg(f'<rect width="512" height="512" rx="120" fill="{BG}"/>{art()}', size=32) + '\n'
    )

    densities = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    full = svg(art())
    # Adaptive layers are 108dp with the visible part in the central ~72dp: put the
    # 512 artwork box into the middle 2/3 of the canvas (view box grows by 1.5×).
    pad = 128
    adaptive_view = (-pad, -pad, 512 + 2 * pad, 512 + 2 * pad)
    for name, scale in densities.items():
        d = os.path.join(RES, f'mipmap-{name}')
        px = round(48 * scale)
        render(full, os.path.join(d, 'ic_launcher.png'), px, glow=glow_svg(), bg=BG, mask=rounded_square)
        render(full, os.path.join(d, 'ic_launcher_round.png'), px, glow=glow_svg(), bg=BG, mask=circle)
        fg = round(108 * scale)
        render(svg(art(), view=adaptive_view), os.path.join(d, 'ic_launcher_foreground.png'), fg, glow=glow_svg(adaptive_view))
        render(svg(art(mono=True), view=adaptive_view), os.path.join(d, 'ic_launcher_monochrome.png'), fg)

    anydpi = os.path.join(RES, 'mipmap-anydpi-v26')
    os.makedirs(anydpi, exist_ok=True)
    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n'
        '</adaptive-icon>\n'
    )
    for n in ('ic_launcher.xml', 'ic_launcher_round.xml'):
        open(os.path.join(anydpi, n), 'w').write(adaptive_xml)
    open(os.path.join(RES, 'values/ic_launcher_background.xml'), 'w').write(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">{BG}</color>\n</resources>\n'
    )

    # iOS: full-bleed opaque squares (the system applies the rounded mask).
    ios_full = svg(f'<rect width="512" height="512" fill="{BG}"/>{art()}')
    contents = json.load(open(os.path.join(IOS, 'Contents.json')))
    for image in contents['images']:
        pt = float(image['size'].split('x')[0])
        px = round(pt * int(image['scale'][0]))
        filename = f'icon-{px}.png'
        render(ios_full, os.path.join(IOS, filename), px, glow=glow_svg(), bg=BG)
        image['filename'] = filename
    json.dump(contents, open(os.path.join(IOS, 'Contents.json'), 'w'), indent=2)
    open(os.path.join(IOS, 'Contents.json'), 'a').write('\n')
    print('icons written')


if __name__ == '__main__':
    main()
