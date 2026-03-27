import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generateCotizacionPDF(
  pageEl: HTMLDivElement,
  filename: string = "cotizacion.pdf"
): Promise<void> {
  // Temporarily reset any CSS transform on the element or its parents
  const scrollParent = pageEl.closest('[style*="transform"]') as HTMLElement | null;
  const origTransform = scrollParent?.style.transform || "";
  const origTransformOrigin = scrollParent?.style.transformOrigin || "";
  
  if (scrollParent) {
    scrollParent.style.transform = "none";
    scrollParent.style.transformOrigin = "top left";
  }

  const canvas = await html2canvas(pageEl, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: 595,
    height: 842,
    windowWidth: 595,
    windowHeight: 842,
    onclone: (clonedDoc) => {
      const el = clonedDoc.querySelector('[data-pdf-page="1"]') as HTMLElement;
      if (!el) return;
      
      el.querySelectorAll<HTMLElement>('[data-pdf-band]').forEach(band => {
        band.style.overflow = 'hidden';
      });

      el.querySelectorAll<HTMLElement>('[data-pdf-band-label="true"]').forEach(span => {
        span.style.display = 'table-cell';
        span.style.verticalAlign = 'middle';
        span.style.lineHeight = '1';
        span.style.paddingTop = '0';
        span.style.paddingBottom = '0';
        span.style.position = 'relative';
        span.style.top = '-1px';
      });
      
      el.querySelectorAll<HTMLElement>('[data-pdf-table-head="true"]').forEach(th => {
        th.style.verticalAlign = 'middle';
        th.style.lineHeight = '1';
        th.style.paddingTop = '0';
        th.style.paddingBottom = '0';
        th.style.position = 'relative';
        th.style.top = '-1px';
      });
    },
  });

  // Restore transform
  if (scrollParent) {
    scrollParent.style.transform = origTransform;
    scrollParent.style.transformOrigin = origTransformOrigin;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
