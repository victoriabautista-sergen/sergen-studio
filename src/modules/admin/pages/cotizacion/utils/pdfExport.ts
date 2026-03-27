import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generateCotizacionPDF(
  pageEl: HTMLDivElement,
  filename: string = "cotizacion.pdf"
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: 595,
    height: 842,
  });

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
