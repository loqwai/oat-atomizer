const onResize = (entries, canvasToDisplaySizeMap) => {
  for (const entry of entries) {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    if (entry.devicePixelContentBoxSize) {
      // NOTE: Only this path gives the correct answer
      // The other paths are imperfect fallbacks
      // for browsers that don't provide anyway to do this
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // it's already in width and height
    } else if (entry.contentBoxSize) {
      if (entry.contentBoxSize[0]) {
        width = entry.contentBoxSize[0].inlineSize;
        height = entry.contentBoxSize[0].blockSize;
      } else {
        width = entry.contentBoxSize.inlineSize;
        height = entry.contentBoxSize.blockSize;
      }
    } else {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
  }
}

export const resizeCanvasToDisplaySize = (canvas) => {
  const canvasToDisplaySizeMap = new Map([[canvas, [canvas.clientWidth, canvas.clientHeight]]]);

  // Get the size the browser is displaying the canvas in device pixels.
  const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

  // Check if the canvas is not the same size.
  const needResize = canvas.width != displayWidth ||
    canvas.height != displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return canvasToDisplaySizeMap;
}

export const initAutoResize = (canvas) => {
  const canvasToDisplaySizeMap = resizeCanvasToDisplaySize(canvas);

  const resizeObserver = new ResizeObserver((entries) => onResize(entries, canvasToDisplaySizeMap));
  resizeObserver.observe(canvas, { box: 'content-box' });
};