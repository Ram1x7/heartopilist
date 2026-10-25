# Screenshot import verification

## Behavior

Screenshot import restores cell colors separately from ordinary photo conversion.
The default preserves recovered colors, keeps the background, and disables dithering.
All 22 presets with outline data are selectable, including furniture and books.
Guide ridge matching suggests a preset; the displayed score is a match indicator,
not a calibrated probability. Ambiguous candidates remain a manual choice.

Alignment retains fractional source coordinates, refines outline placement, and
fits cell pitch and phase. The adjustment view overlays the target grid and offers
a correction button. Recovery samples within each cell, avoids detected guide
pixels near known contours, and leaves unavailable cells transparent. Color
stabilization uses frequent colors to correct uncertain compression artifacts;
both guide suppression and color stabilization can be disabled for comparison.
It cannot reconstruct colors entirely hidden behind UI or thick guide lines.

Applying a screenshot commits the full draft before updating the live editor,
without reloading. Parts of the same item and its saved-design identity remain;
a different item starts a new project. Named saves require the normal Save action.
A storage failure leaves the old draft and live project unchanged. Closing the
import cancels pending matching so stale results cannot replace a later upload.

## Automated checks

Run:

```sh
node --experimental-vm-modules --test tests/art-project.test.mjs tests/art-screenshot-recovery.test.mjs tests/art-3d.test.mjs tests/art-3d-export.test.mjs
```

The restoration fixtures are generated rasters with known cell colors, fractional
placement, thin grids, contour overlays, and deterministic noise. They test position
correction, 65 distinct colors, isolated one-cell details, missing source pixels,
matching among all presets, cancellation, and draft transaction behavior.

`fixtures/generated-screenshot-jpeg.json` contains a generated reference encoded
independently with JPEG quality 82 and 4:2:0 chroma subsampling, then decoded and
stored as zlib-compressed RGBA. Its 432 cells recover as 412/432 (95.37%) with color
stabilization disabled and 432/432 with stabilization enabled. These measurements
use the known rectangle; they do not measure end-to-end auto-detection accuracy.

These inputs are **not actual game screenshots**. Real-game accuracy, heavily
occluded outlines, camera perspective, and device-specific image decoding remain
unmeasured. Passing fixtures does not guarantee identical colors for every upload.
