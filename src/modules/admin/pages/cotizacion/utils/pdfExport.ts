export async function generateCotizacionPDF(
  pageEl: HTMLDivElement,
  filename: string = "cotizacion.pdf"
): Promise<void> {
  // Clone the preview element
  const clone = pageEl.cloneNode(true) as HTMLDivElement;

  // Reset any transforms and make it fill exactly one A4 page
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.position = "relative";
  clone.style.width = "186mm";   // 210mm - 2*12mm margins
  clone.style.height = "273mm";  // 297mm - 2*12mm margins
  clone.style.maxHeight = "273mm";
  clone.style.overflow = "hidden";
  clone.style.padding = "0";
  clone.style.boxSizing = "border-box";
  // Collect all stylesheets from the parent document
  const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  const styleHTML = styleSheets.map(el => el.outerHTML).join("\n");

  // Build a full HTML document for printing
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  ${styleHTML}
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
    }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`;
  // Create a hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Could not access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for images to load then print
  return new Promise<void>((resolve) => {
    const images = Array.from(iframeDoc.querySelectorAll("img"));
    const imagePromises = images.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) return res();
          img.onload = () => res();
          img.onerror = () => res();
        })
    );

    Promise.all(imagePromises).then(() => {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Cleanup after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      }, 500);
    });
  });
}
