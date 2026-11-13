# Buat latar putih logo kurikulum jadi transparan (flood fill dari tepi,
# jadi putih DI DALAM logo - mis. halaman buku - tetap utuh). Defringe 1px
# untuk menghaluskan sisa halo putih di tepi anti-aliasing.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def make_transparent(path, white_thresh=242):
    im = Image.open(path).convert('RGBA')
    arr = np.array(im).astype(np.int16)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]
    # Kandidat latar: nyaris putih DAN belum transparan.
    near_white = (rgb[:, :, 0] >= white_thresh) & (rgb[:, :, 1] >= white_thresh) & (rgb[:, :, 2] >= white_thresh) & (alpha > 0)
    labels, n = ndimage.label(near_white)
    h, w = near_white.shape
    border_labels = set(np.unique(np.concatenate([
        labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1],
    ])))
    border_labels.discard(0)
    background = np.isin(labels, list(border_labels)) if border_labels else np.zeros_like(near_white)
    out_alpha = alpha.copy()
    out_alpha[background] = 0
    # Defringe: piksel buram di tepi latar yang masih sangat terang -> turunkan alpha.
    edge = ndimage.binary_dilation(background) & ~background & (alpha > 0)
    ys, xs = np.where(edge)
    for y, x in zip(ys, xs):
        mn = int(rgb[y, x].min())
        if mn >= 200:
            out_alpha[y, x] = int(255 * max(0.0, (250 - mn) / 50.0))
    arr[:, :, 3] = out_alpha
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save(path)
    total = h * w
    print(f'{path}: {total - int(background.sum())} px buram tersisa, {int(background.sum())} px latar jadi transparan ({100 * background.mean():.1f}% area)')

if __name__ == '__main__':
    for p in sys.argv[1:]:
        make_transparent(p)
