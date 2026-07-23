'use client';

import { LineItem } from '@/lib/types';

export function LineItemsEditor({
  lines,
  onChange,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
}) {
  function updateLine(index: number, patch: Partial<LineItem>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    onChange([...lines, { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="flex items-end gap-2">
          <input
            value={line.description}
            onChange={(e) => updateLine(i, { description: e.target.value })}
            placeholder="Description"
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={line.quantity}
            onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
            placeholder="Qté"
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={line.unitPrice}
            onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })}
            placeholder="PU"
            className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={line.vatRate}
            onChange={(e) => updateLine(i, { vatRate: Number(e.target.value) })}
            placeholder="TVA %"
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button type="button" onClick={() => removeLine(i)} className="px-2 text-sm text-red-600">
            Retirer
          </button>
        </div>
      ))}
      <button type="button" onClick={addLine} className="text-sm text-slate-600 underline">
        + Ajouter une ligne
      </button>
    </div>
  );
}
