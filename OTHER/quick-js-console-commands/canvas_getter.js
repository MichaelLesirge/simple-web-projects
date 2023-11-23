const dataURL = canvas.toDataURL("image/png");
const newTab = window.open('about:blank','image from canvas');
newTab.document.write("<img src='" + dataURL + "' alt='from canvas'/>");