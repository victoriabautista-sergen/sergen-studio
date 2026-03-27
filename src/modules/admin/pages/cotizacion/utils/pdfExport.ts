import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generateCotizacionPDF(
  pageEl: HTMLDivElement,
  filename: string = "cotizacion.pdf"
): Promise<void> {
  // Temporarily reset any CSS transform on the element or its parents
  // so html2canvas captures at 1:1 scale matching the preview
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
