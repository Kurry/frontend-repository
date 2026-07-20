import re
with open("grid-tool.js", "r") as f:
    content = f.read()

# 1. Remove anticheat global
content = content.replace("window.__SHAPESHIFT_TEST_BOARDS__ = () => savedBoards;", "")

# 2. Add Export / Import Modal Event Listeners
listeners_str = """
  document.getElementById('exportModalBtn').onclick = () => {
    updateExportPreview();
    document.getElementById('exportDialog').showModal();
  };
  document.getElementById('importModalBtn').onclick = () => {
    document.getElementById('importDialog').showModal();
  };
"""
content = content.replace("document.body.appendChild(importDialog);", f"document.body.appendChild(importDialog);\n{listeners_str}")

# 3. Lock slider after first paint
slider_logic = """
  function lockSlider() {
    const slider = document.getElementById('gpCellSize');
    if(slider) {
      slider.disabled = true;
      slider.style.opacity = '0.5';
      slider.style.cursor = 'not-allowed';
    }
  }
"""
content = content.replace("function saveGalleryState()", f"{slider_logic}\n\n  function saveGalleryState()")
content = content.replace("pushHistory();", "pushHistory(); lockSlider();")
content = content.replace("function clearBoard() {", "function clearBoard() {\n    const slider = document.getElementById('gpCellSize');\n    if(slider) {\n        slider.disabled = false;\n        slider.style.opacity = '1';\n        slider.style.cursor = 'pointer';\n    }")
content = content.replace("function finalizeUpload(img, ox, oy, sz) {", "function finalizeUpload(img, ox, oy, sz) {\n    lockSlider();")

# 4. Branded footer on PNG export
footer_logic = """
    // Add branded footer
    const brandedCanvas = document.createElement('canvas');
    const bCtx = brandedCanvas.getContext('2d');
    const footerHeight = 40;
    brandedCanvas.width = drawCanvas.width;
    brandedCanvas.height = drawCanvas.height + footerHeight;
    bCtx.drawImage(drawCanvas, 0, 0);

    // Draw footer
    bCtx.fillStyle = '#000000';
    bCtx.fillRect(0, drawCanvas.height, brandedCanvas.width, footerHeight);

    // Draw text
    bCtx.fillStyle = '#FFFFFF';
    bCtx.font = 'bold 12px Arial';
    bCtx.textAlign = 'left';
    bCtx.fillText('/MADE WITH SHAPESHIFT GRID TOOL', 10, drawCanvas.height + 25);

    bCtx.textAlign = 'right';
    bCtx.fillText('<SHAPESHIFTFESTIVAL.COM>', brandedCanvas.width - 10, drawCanvas.height + 25);

    const dataUrl = brandedCanvas.toDataURL('image/png');
"""
content = content.replace("const dataUrl = drawCanvas.toDataURL('image/png');", footer_logic)

with open("grid-tool.js", "w") as f:
    f.write(content)
