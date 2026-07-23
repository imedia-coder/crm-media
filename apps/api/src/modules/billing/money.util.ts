type Numeric = number | string | { toString(): string };

export interface LineLike {
  quantity: Numeric;
  unitPrice: Numeric;
  vatRate: Numeric;
}

export interface Totals {
  subtotal: number;
  vatTotal: number;
  total: number;
}

export function computeTotals(lines: LineLike[]): Totals {
  let subtotal = 0;
  let vatTotal = 0;
  for (const line of lines) {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const vatRate = Number(line.vatRate);
    const lineSubtotal = quantity * unitPrice;
    subtotal += lineSubtotal;
    vatTotal += lineSubtotal * (vatRate / 100);
  }
  return {
    subtotal: round2(subtotal),
    vatTotal: round2(vatTotal),
    total: round2(subtotal + vatTotal),
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function nextDocumentNumber(
  prefix: string,
  countExisting: (yearStart: Date) => Promise<number>,
): Promise<string> {
  const year = new Date().getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const count = await countExisting(yearStart);
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}
