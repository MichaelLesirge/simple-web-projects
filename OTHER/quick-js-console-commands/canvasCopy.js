function printCanvas() {
    var canvas = document.getElementById('anycanvas');
    var dataUrl = canvas.toDataURL();

    var newWin = window.open();
    var htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Canvas</title>
        </head>
        <body onload="window.print(); window.close();">
            <img src="${dataUrl}">
        </body>
        </html>`;

    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    
    newWin.location.href = url;
}
