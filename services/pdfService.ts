import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PDFAttachment } from '../types';

// Set worker source for PDF.js
// In a real build environment, you might import the worker differently.
// Using CDN for simplicity and broad compatibility in this snippet.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const loadPDF = async (file: File): Promise<ArrayBuffer> => {
  return await file.arrayBuffer();
};

export const renderPageToCanvas = async (
  pdfData: ArrayBuffer,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<{ width: number; height: number; originalWidth: number; originalHeight: number }> => {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1); // PDF.js uses 1-based indexing

  const viewport = page.getViewport({ scale });
  
  // Set dimensions
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: canvas.getContext('2d')!,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;

  return {
    width: viewport.width,
    height: viewport.height,
    originalWidth: viewport.width / scale,
    originalHeight: viewport.height / scale,
  };
};

export const getPDFPageCount = async (pdfData: ArrayBuffer): Promise<number> => {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
};

export const savePDF = async (originalPdfBytes: ArrayBuffer, attachments: PDFAttachment[], scale: number) => {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const attachment of attachments) {
    if (attachment.pageIndex >= pages.length) continue;
    
    const page = pages[attachment.pageIndex];
    const { height } = page.getSize();

    // Coordinate conversion
    // DOM (0,0) is Top-Left. PDF (0,0) is Bottom-Left.
    // We also need to account for the scale factor used in the UI.
    const pdfX = attachment.x / scale;
    // For Y, we invert. Note: We might need a slight adjustment for font baseline.
    const pdfY = height - (attachment.y / scale) - (attachment.fontSize / 2); // approximate baseline

    page.drawText(attachment.text, {
      x: pdfX,
      y: pdfY,
      size: attachment.fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};