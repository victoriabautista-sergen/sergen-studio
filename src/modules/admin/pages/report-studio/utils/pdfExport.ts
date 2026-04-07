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
    /* Page content wrapper - fills the page with flex to push footer down */
    .pdf-page-inner {
      width: 100%;
      height: 100%;
      padding: 12mm 14mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    /* Ensure thin borders in print */
    table {
      border-collapse: collapse;
    }
    td, th {
      border-width: 0.5px !important;
    }
    /* Hide structural spacer rows borders completely */
    tr.spacer-row td,
    td.border-0, th.border-0,
    td[class*="border-0"], th[class*="border-0"] {
      border: none !important;
      border-width: 0 !important;
    }
    /* Footer styling - always at bottom */
    .pdf-footer {
      margin-top: auto;
      flex-shrink: 0;
      font-size: 9px !important;
      color: #6b7280 !important;
      border-top: 1px solid #e5e7eb;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
    }
    .pdf-footer span {
      font-size: 9px !important;
      color: #6b7280 !important;
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
    
    const innerWrapper = iframeDoc.createElement("div");
    innerWrapper.className = "pdf-page-inner";
    innerWrapper.innerHTML = pageEls[i].innerHTML;
    
    pageWrapper.appendChild(innerWrapper);
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
