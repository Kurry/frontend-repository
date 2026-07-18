# Grid Paint Studio

Interactive QR/color grid painter: paint a structured canvas with QR brush, solid color brush, or eraser; upload or camera-capture images into the grid; download/share the result.

## Happy path
1. Adjust cell size (locks after first paint).
2. Pick QR Brush or Color Brush + a palette swatch.
3. Paint on the stage (or Upload / Camera → Capture).
4. Toggle grid, Undo / Clear as needed.
5. Download (or Share on mobile).

## Stack
Static `index.html` + `styles.css` + `app.js`, QRious 4.x from `assets/`.

## Serve
`python3 -m http.server 9304` → http://127.0.0.1:9304/
