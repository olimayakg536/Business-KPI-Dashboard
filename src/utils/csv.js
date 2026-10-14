// CSV reading happens entirely in the browser; nothing is uploaded anywhere.
import Papa from 'papaparse';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB keeps the browser responsive

/** Parses CSV text into { rows, headers }. */
export function parseCsvText(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
  });
  const headers = (result.meta.fields ?? []).filter((h) => h !== '');
  return { rows: result.data, headers };
}

/** Reads a user-selected File and parses it. Throws Error with a friendly message. */
export async function readCsvFile(file) {
  if (!file) throw new Error('No file was selected.');
  if (!/\.(csv|txt)$/i.test(file.name) && !/csv|text\/plain/i.test(file.type)) {
    throw new Error('Please choose a .csv file.');
  }
  if (file.size === 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_FILE_BYTES) throw new Error('The file is larger than 10 MB. Please upload a smaller CSV.');
  const text = await file.text();
  return parseCsvText(text);
}
