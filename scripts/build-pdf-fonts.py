"""
Builds the PDF report font.

Fontsource splits Inter into per-script woff2 files that the browser recombines
via CSS unicode-range. jsPDF has no such mechanism, so the latin and latin-ext
subsets are merged into a single TTF containing exactly the characters the
report can print.

Run with:  npm run build:pdf-fonts
Requires:  python3 -m pip install fonttools, and the woff2 CLI tools.

The generated files are committed, so this only needs re-running when Inter is
upgraded or the report gains characters. Output is not byte-reproducible (the
font tables carry a build timestamp); src/main/fonts/fonts.test.ts asserts the
coverage that actually matters.
"""
import os
import subprocess
import sys
import shutil
import tempfile

from fontTools.ttLib import TTFont
from fontTools.merge import Merger
from fontTools.subset import Subsetter, Options
from fontTools.varLib.instancer import instantiateVariableFont

SRC_DIR = 'node_modules/@fontsource-variable/inter/files'
OUT_DIR = 'src/main/fonts'
WORK = tempfile.mkdtemp(prefix='pdf-fonts-')

CHARS = (
    ''.join(chr(c) for c in range(0x20, 0x7F))
    + 'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ'
    + '×·–—…„“”‚‘’€'
    # Letters that appear only in the localised names of territories the report
    # can list, not in Slovak itself: Curaçao, Åland, Saint-Barthélemy.
    + 'çÇåÅ'
)


def decompress(name: str) -> str:
    """woff2 -> ttf; fontTools needs brotli for woff2, the CLI tool does not."""
    src = os.path.join(SRC_DIR, name)
    dst = os.path.join(WORK, name.replace('.woff2', '.ttf'))
    tmp = os.path.join(WORK, name)
    shutil.copy(src, tmp)
    subprocess.run(['woff2_decompress', tmp], check=True, capture_output=True)
    return dst


def instance(src: str, weight: int, out: str) -> str:
    font = TTFont(src)
    font = instantiateVariableFont(font, {'wght': weight}, updateFontNames=False)
    font.save(out)
    return out


def build(weight: int, out_name: str) -> None:
    latin = instance(decompress('inter-latin-wght-normal.woff2'), weight,
                     os.path.join(WORK, f'_lat{weight}.ttf'))
    ext = instance(decompress('inter-latin-ext-wght-normal.woff2'), weight,
                   os.path.join(WORK, f'_ext{weight}.ttf'))

    merged_path = os.path.join(WORK, f'_merged{weight}.ttf')
    merger = Merger()
    merged = merger.merge([latin, ext])
    merged.save(merged_path)

    font = TTFont(merged_path)
    options = Options()
    options.layout_features = []
    options.name_IDs = ['*']
    options.notdef_outline = True
    options.drop_tables += ['DSIG']

    subsetter = Subsetter(options=options)
    subsetter.populate(text=CHARS)
    subsetter.subset(font)

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, out_name)
    font.flavor = None
    font.save(out)

    check = TTFont(out)
    cps = set()
    for table in check['cmap'].tables:
        cps |= set(table.cmap.keys())
    missing = [c for c in CHARS if ord(c) not in cps]
    size = os.path.getsize(out)
    print(f'{out}  {size / 1024:.0f} KB  missing: {"".join(missing) or "none"}')
    if missing:
        sys.exit(f'FAILED: {out} is missing glyphs')


build(400, 'Inter-Regular.ttf')
build(600, 'Inter-SemiBold.ttf')
