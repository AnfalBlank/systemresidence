// Dependency-free export helpers for tabular reports.
// - Excel: builds an HTML table saved as .xls (opens natively in Excel / Google Sheets)
// - PDF: opens a styled print window; user picks "Save as PDF"

export interface ExportColumn<T> {
  header: string
  value: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
}

function escapeHtml(v: string | number): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob(['\ufeff' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Export rows to an Excel-compatible .xls file via an HTML table. */
export function exportToExcel<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  opts?: { title?: string; meta?: string[] },
) {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
  const body = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td>${escapeHtml(c.value(r))}</td>`)
          .join('')}</tr>`,
    )
    .join('')

  const titleRow = opts?.title
    ? `<tr><th colspan="${columns.length}" style="font-size:16px;text-align:left">${escapeHtml(opts.title)}</th></tr>`
    : ''
  const metaRows = (opts?.meta ?? [])
    .map((m) => `<tr><td colspan="${columns.length}">${escapeHtml(m)}</td></tr>`)
    .join('')

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" /></head>
<body><table border="1">
${titleRow}${metaRows}${opts?.title || metaRows ? `<tr><td colspan="${columns.length}"></td></tr>` : ''}
<thead><tr>${head}</tr></thead>
<tbody>${body}</tbody>
</table></body></html>`

  triggerDownload(html, filename.endsWith('.xls') ? filename : `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8')
}

/** Open a styled print window for saving as PDF. */
export function exportToPdf<T>(
  columns: ExportColumn<T>[],
  rows: T[],
  opts?: { title?: string; subtitle?: string; meta?: string[] },
) {
  const head = columns
    .map((c) => `<th style="text-align:${c.align ?? 'left'}">${escapeHtml(c.header)}</th>`)
    .join('')
  const body = rows
    .map(
      (r) =>
        `<tr>${columns
          .map(
            (c) =>
              `<td style="text-align:${c.align ?? 'left'}">${escapeHtml(c.value(r))}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('')

  const meta = (opts?.meta ?? []).map((m) => `<p class="meta">${escapeHtml(m)}</p>`).join('')

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up diblokir. Izinkan pop-up untuk mengekspor PDF.')
    return
  }
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />
<title>${escapeHtml(opts?.title ?? 'Laporan')}</title>
<style>
  * { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #222; }
  body { padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 13px; font-weight: 400; color: #717171; margin: 0 0 16px; }
  .meta { font-size: 12px; color: #717171; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; }
  thead th { background: #f7f7f7; }
  tbody tr:nth-child(even) { background: #fafafa; }
  @media print { body { padding: 0; } .noprint { display: none; } }
</style></head><body>
<h1>${escapeHtml(opts?.title ?? 'Laporan')}</h1>
${opts?.subtitle ? `<h2>${escapeHtml(opts.subtitle)}</h2>` : ''}
${meta}
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`)
  win.document.close()
}
