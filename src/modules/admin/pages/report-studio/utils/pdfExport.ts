export async function generateReportPDF(
  pagesContainerEl: HTMLDivElement,
  filename: string = "reporte.pdf"
): Promise<void> {
  const pageEls = pagesContainerEl.querySelectorAll<HTMLDivElement>("[data-pdf-page]");
  if (pageEls.length === 0) return;

  // Clone all pages into a hidden iframe for native print
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  // Copy stylesheets
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  const styleHTML = stylesheets.map(el => el.outerHTML).join("\n");

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      background: #ffffff !important;
    }
    body {
      display: block;
    }
    .pdf-page {
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff !important;
      overflow: hidden;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-page + .pdf-page {
      page-break-before: always;
      break-before: page;
    }
    /* Ensure thin borders in print */
    table {
      border-collapse: collapse;
    }
    td, th {
      border-width: 0.5px !important;
    }
  </style>
</head>
<body>
</body>
</html>`);
  iframeDoc.close();

  // Clone each page into the iframe
  for (let i = 0; i < pageEls.length; i++) {
    const pageWrapper = iframeDoc.createElement("div");
    pageWrapper.className = "pdf-page";
    pageWrapper.innerHTML = pageEls[i].innerHTML;
    iframeDoc.body.appendChild(pageWrapper);
  }

  // Wait for fonts and images to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Wait for images
  const images = iframeDoc.querySelectorAll("img");
  if (images.length > 0) {
    await Promise.all(
      Array.from(images).map(
        img =>
          new Promise<void>(resolve => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  }

  // Trigger print
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  // Clean up after a delay
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}
