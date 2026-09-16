export interface CsvField {
  label: string;
  value: string;
}

const escapeCell = (raw: unknown): string => {
  const str = raw === null || raw === undefined ? "" : String(raw);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const toCSV = (fields: CsvField[], rows: Record<string, unknown>[]): string => {
  const header = fields.map((f) => escapeCell(f.label)).join(",");
  const body = rows
    .map((row) => fields.map((f) => escapeCell(row[f.value])).join(","))
    .join("\r\n");
  return `${header}\r\n${body}`;
};