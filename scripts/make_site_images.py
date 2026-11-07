"""Render the social preview image and favicons from the emblem assets.

One-off asset tool, not part of the build. Needs Python 3 + Pillow.
Usage: python scripts/make_site_images.py

Writes public/og-image.png (1200x630), public/favicon.png (64), public/apple-touch-icon.png (180).
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "src" / "assets"
OUT = ROOT / "public"
FONT = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default(size)


def tint(mask_path, hex_color, size):
    alpha = Image.open(mask_path).getchannel("A").resize((size, size), Image.LANCZOS)
    layer = Image.new("RGBA", (size, size), hex_color)
    layer.putalpha(alpha)
    return layer


def emblem(fg, bg, pri, sec, bgc, size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    img.alpha_composite(tint(A / "backgrounds" / bg / "mask.png", bgc, size))
    if (A / "emblems" / fg / "secondary.png").exists():
        img.alpha_composite(tint(A / "emblems" / fg / "secondary.png", sec, size))
    img.alpha_composite(tint(A / "emblems" / fg / "primary.png", pri, size))
    return img


# --- Social preview (Open Graph / Twitter), 1200x630
og = Image.new("RGBA", (1200, 630), "#0d1418")
glow = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((-200, -420, 1400, 360), fill=(29, 46, 56, 255))
og.alpha_composite(glow.filter(ImageFilter.GaussianBlur(80)))

showcase = [  # (emblem, background, primary, secondary, background colour, size, x, y)
    ("Sol", "Circle", "#85064b", "#f1be31", "#598ad9", 300, 610, 40),
    ("Spartan", "Shield", "#1b1f1a", "#c47a2c", "#6b7a4b", 240, 900, 30),
    ("Phoenix", "Hexagon", "#ff2e88", "#f9f871", "#1f1147", 220, 880, 300),
    ("Flaming Ninja", "Sun", "#0b3c5d", "#ff6f59", "#38a3a5", 220, 690, 370),
    ("Bullseye", "Octagon", "#9c3433", "#dedede", "#656565", 150, 1040, 450),
]
for fg, bg, pri, sec, bgc, size, x, y in showcase:
    og.alpha_composite(emblem(fg, bg, pri, sec, bgc, size), (x, y))

d = ImageDraw.Draw(og)
d.text((70, 170), "HALO 3", font=font(54), fill="#5fb4e6")
d.text((66, 232), "EMBLEM", font=font(84), fill="#ffffff")
d.text((66, 326), "GENERATOR", font=font(84), fill="#ffffff")
d.text((70, 470), "80 emblems · 48 backgrounds", font=font(26), fill="#cfe3ee")
d.text((70, 508), "112 colour palettes · free 512×512 PNG", font=font(26), fill="#cfe3ee")
og.convert("RGB").save(OUT / "og-image.png", optimize=True)

# --- Favicons: Sol on a circle in the Forest palette (Pine, Fern, Parchment)
for name, size in (("favicon.png", 64), ("apple-touch-icon.png", 180)):
    emblem("Sol", "Circle", "#1e3d2b", "#6a994e", "#f2e8cf", size).save(OUT / name, optimize=True)

print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))
