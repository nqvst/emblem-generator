"""Convert the "Halo 3 High Resolution Emblem Pack" (SK CRISIS) into the app's artwork.

One-off asset tool, not part of the build. Needs Python 3 + Pillow + numpy.
Usage: python scripts/import_pack.py "<extracted rar>/Halo 3 Emblems"

Writes white-on-alpha masks (colour is applied in the browser):
  src/assets/emblems/<Name>/primary.png    + primary.thumb.png
  src/assets/emblems/<Name>/secondary.png  + secondary.thumb.png   (absent for single-layer emblems)
  src/assets/backgrounds/<Name>/mask.png   + mask.thumb.png
Full masks are 512x512 (the export size); thumbs are small enough for the picker grids.
"""
import re
import sys
import pathlib

import numpy as np
from PIL import Image

FULL, THUMB = 512, 112
SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "assets"
RENAME = {"Ying Yang": "Yin Yang", "Vertical Hexigon": "Vertical Hexagon"}
SKIP = {"Helmet"}  # pixel-identical duplicate of "Demon"


def alpha_of(path):
    rgba = np.array(Image.open(path).convert("RGBA"))
    alpha = rgba[..., 3].copy()
    # The source PNGs carry black registration marks in the corners; the artwork itself is grey.
    alpha[rgba[..., :3].max(-1) < 40] = 0
    return Image.fromarray(alpha)


def save_layer(alpha, folder, layer):
    folder.mkdir(parents=True, exist_ok=True)
    for size, suffix in ((FULL, ""), (THUMB, ".thumb")):
        mask = alpha.resize((size, size), Image.LANCZOS)
        Image.merge("LA", (Image.new("L", mask.size, 255), mask)).save(folder / f"{layer}{suffix}.png", optimize=True)


layers = {}
for f in sorted((SRC / "Emblem PNGs").glob("*.png")):
    match = re.fullmatch(r"(.+?)([12]?)", f.stem)
    name = RENAME.get(match.group(1), match.group(1))
    if name not in SKIP:
        layers.setdefault(name, {})[match.group(2) or "1"] = f

for name, files in layers.items():
    save_layer(alpha_of(files["1"]), OUT / "emblems" / name, "primary")
    if "2" in files:
        save_layer(alpha_of(files["2"]), OUT / "emblems" / name, "secondary")

backgrounds = sorted((SRC / "Background PNGs").glob("*.png"))
for f in backgrounds:
    save_layer(alpha_of(f), OUT / "backgrounds" / RENAME.get(f.stem, f.stem), "mask")

# Not part of the pack: a full-frame background for a plain square emblem.
save_layer(Image.new("L", (FULL, FULL), 255), OUT / "backgrounds" / "Solid", "mask")

print(f"{len(layers)} emblems, {len(backgrounds) + 1} backgrounds")
