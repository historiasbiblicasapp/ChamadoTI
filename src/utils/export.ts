import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportColumn {
  header: string;
  accessor: string;
  width?: number;
}

interface ExportData {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  filename: string;
}

// CSV Export
export function exportToCSV(data: ExportData) {
  const headers = data.columns.map((col) => col.header);
  const rows = data.rows.map((row) =>
    data.columns.map((col) => {
      const value = row[col.accessor];
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${data.filename}.csv`);
}

// PDF Export
export function exportToPDF(data: ExportData) {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header
  doc.setFontSize(18);
  doc.text(data.title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`, 14, 22);

  // Table
  const tableColumns = data.columns.map((col) => ({ header: col.header, dataKey: col.accessor }));
  const tableRows = data.rows.map((row) => {
    const newRow: Record<string, any> = {};
    data.columns.forEach((col) => {
      const value = row[col.accessor];
      newRow[col.accessor] = value === null || value === undefined ? '' : String(value);
    });
    return newRow;
  });

  (doc as any).autoTable({
    startY: 28,
    columns: tableColumns,
    body: tableRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { top: 28 },
  });

  doc.save(`${data.filename}.pdf`);
}

// Excel Export
export async function exportToExcel(data: ExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChamadosTiRaitz';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(data.title.substring(0, 31));

  // Header row
  sheet.columns = data.columns.map((col) => ({
    header: col.header,
    key: col.accessor,
    width: col.width || 20,
  }));

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Data rows
  data.rows.forEach((row) => {
    const rowData: Record<string, any> = {};
    data.columns.forEach((col) => {
      rowData[col.accessor] = row[col.accessor] ?? '';
    });
    sheet.addRow(rowData);
  });

  // Auto-filter
  if (data.rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: data.columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${data.filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to format ticket data for export
export function formatTicketsForExport(tickets: any[]) {
  return tickets.map((t) => ({
    '#': t.ticket_number,
    Data: t.scheduled_date || format(new Date(t.created_at), 'dd/MM/yyyy'),
    Titulo: t.title,
    Status: t.status,
    Prioridade: t.priority,
    Categoria: t.category?.name || '',
    Solicitante: t.requester?.full_name || '',
    Atendente: t.assignee?.full_name || '',
    Criado: format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
    Resolvido: t.resolved_at ? format(new Date(t.resolved_at), 'dd/MM/yyyy HH:mm') : '',
  }));
}

export function formatAssetsForExport(assets: any[]) {
  return assets.map((a) => ({
    Patrimonio: a.patrimony || '',
    Nome: a.name,
    Tipo: a.type,
    Marca: a.brand || '',
    Modelo: a.model || '',
    'Nr Serie': a.serial_number || '',
    IP: a.ip_address || '',
    MAC: a.mac_address || '',
    Local: a.location || '',
    Status: a.status,
    Responsavel: a.user?.full_name || '',
    Setor: a.department?.name || '',
    'Criado em': format(new Date(a.created_at), 'dd/MM/yyyy'),
  }));
}
