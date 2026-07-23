import PDFDocument from 'pdfkit';
import { LineLike, computeTotals } from './money.util';

export interface RenderDocumentPdfParams {
  documentTypeLabel: string;
  number: string;
  tenantName: string;
  companyName: string;
  currency: string;
  issuedAt: Date;
  dueDate?: Date | null;
  lines: (LineLike & { description: string })[];
}

export function renderDocumentPdf(params: RenderDocumentPdfParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(params.documentTypeLabel, { align: 'right' });
    doc.fontSize(10).text(params.number, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(14).text(params.tenantName);
    doc.moveDown();
    doc.fontSize(11).text(`Client : ${params.companyName}`);
    doc.text(`Date : ${params.issuedAt.toLocaleDateString('fr-FR')}`);
    if (params.dueDate) {
      doc.text(`Échéance : ${params.dueDate.toLocaleDateString('fr-FR')}`);
    }
    doc.moveDown(1.5);

    for (const line of params.lines) {
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      const vatRate = Number(line.vatRate);
      const lineTotal = quantity * unitPrice;
      doc
        .fontSize(10)
        .text(
          `${line.description} — ${quantity} x ${unitPrice.toFixed(2)} ${params.currency} ` +
            `(TVA ${vatRate}%) = ${lineTotal.toFixed(2)} ${params.currency}`,
        );
      doc.moveDown(0.5);
    }

    const totals = computeTotals(params.lines);
    doc.moveDown();
    doc.text('----------------------------------------');
    doc.fontSize(10).text(`Sous-total HT : ${totals.subtotal.toFixed(2)} ${params.currency}`);
    doc.text(`TVA : ${totals.vatTotal.toFixed(2)} ${params.currency}`);
    doc.fontSize(13).text(`Total TTC : ${totals.total.toFixed(2)} ${params.currency}`);

    doc.end();
  });
}
