function printAllCanvases() {
    // Get all canvas elements on the page
    const canvases = document.querySelectorAll('canvas');

    if (canvases.length === 0) {
        alert('No canvases found on this page.');
        return;
    }

    // Determine the total width and height required
    let totalWidth = 0;
    let totalHeight = 0;
    canvases.forEach(canvas => {
        totalWidth = Math.max(totalWidth, canvas.width);
        totalHeight += canvas.height;
    });

    // Create a new canvas to merge all
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = totalWidth;
    mergedCanvas.height = totalHeight;
    const ctx = mergedCanvas.getContext('2d');

    // Draw all canvases onto the new canvas
    let yOffset = 0;
    canvases.forEach(canvas => {
        ctx.drawImage(canvas, 0, yOffset);
        yOffset += canvas.height;
    });

    // Convert merged canvas to data URL
    const dataUrl = mergedCanvas.toDataURL();

    // Open new window and print the merged image
    const newWin = window.open();
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print All Canvases</title>
        </head>
        <body onload="window.print(); window.close();">
            <img src="${dataUrl}">
        </body>
        </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    newWin.location.href = url;
}
