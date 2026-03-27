import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generateReportPDF(
  pagesContainerEl: HTMLDivElement,
  filename: string = "reporte.pdf"
): Promise<void> {
  const pageEls = pagesContainerEl.querySelectorAll<HTMLDivElement>("[data-pdf-page]");
  if (pageEls.length === 0) return;

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  for (let i = 0; i < pageEls.length; i++) {
    const el = pageEls[i];

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 595,
      height: 842,
    });

    const imgData = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(filename);
}
