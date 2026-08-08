export interface ImportedDocument {
  title: string;
  content: string;
}

const SUPPORTED_EXTENSIONS = ["txt", "pdf", "docx"] as const;

function titleFromFilename(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "").trim();
  return withoutExt || "Sans titre";
}

/** Collapse the extraction noise (stray CRLFs, trailing spaces, big gaps) into
 * a clean script body — cahier des charges §9 "Nettoyage" step. */
function cleanup(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractTxt(file: File): Promise<string> {
  return file.text();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = "";
      }
    }
    if (line) lines.push(line);
    pageTexts.push(lines.join("\n"));
  }
  return pageTexts.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function extractDocument(file: File): Promise<ImportedDocument> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let raw: string;

  switch (extension) {
    case "txt":
      raw = await extractTxt(file);
      break;
    case "pdf":
      raw = await extractPdf(file);
      break;
    case "docx":
      raw = await extractDocx(file);
      break;
    default:
      throw new Error("Format non pris en charge. Utilisez un fichier .txt, .pdf ou .docx.");
  }

  return { title: titleFromFilename(file.name), content: cleanup(raw) };
}

export const IMPORT_ACCEPT = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
