import React from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Column {
    header: string;
    key: string;
    formatter?: (value: any, row: any) => string;
}

interface DataTableToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    title: string;
    columns: Column[];
    data: any[];
    placeholder?: string;
    children?: React.ReactNode;
}

export function DataTableToolbar({
    search,
    onSearchChange,
    title,
    columns,
    data,
    placeholder = 'Search records...',
    children,
}: DataTableToolbarProps) {

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableHeaders = columns.map((col) => col.header);
        const tableData = data.map((row) =>
            columns.map((col) => {
                const val = row[col.key];
                return col.formatter ? col.formatter(val, row) : val !== null && val !== undefined ? String(val) : '';
            })
        );

        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 41, 59] },
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    };

    const exportToExcel = () => {
        const formattedData = data.map((row) => {
            const obj: Record<string, any> = {};
            columns.forEach((col) => {
                const val = row[col.key];
                obj[col.header] = col.formatter ? col.formatter(val, row) : val;
            });
            return obj;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableHeadersHTML = columns.map((col) => `<th style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: left;">${col.header}</th>`).join('');
        const tableRowsHTML = data
            .map(
                (row) =>
                    `<tr>${columns
                        .map((col) => {
                            const val = row[col.key];
                            const display = col.formatter ? col.formatter(val, row) : val !== null && val !== undefined ? String(val) : '';
                            return `<td style="border: 1px solid #cbd5e1; padding: 8px;">${display}</td>`;
                        })
                        .join('')}</tr>`
            )
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title} - Print</title>
                    <style>
                        body { font-family: system-ui, sans-serif; padding: 20px; color: #0f172a; }
                        h2 { margin-bottom: 5px; }
                        p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    </style>
                </head>
                <body>
                    <h2>${title}</h2>
                    <p>Generated on: ${new Date().toLocaleString()} | Qadri General Store</p>
                    <table>
                        <thead><tr>${tableHeadersHTML}</tr></thead>
                        <tbody>${tableRowsHTML}</tbody>
                    </table>
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 bg-card"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {children}
                <div className="flex items-center gap-1 border border-input rounded-md bg-card p-1 shadow-xs">
                    <Button variant="ghost" size="sm" onClick={exportToPDF} className="h-8 gap-1 text-xs">
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                        PDF
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportToExcel} className="h-8 gap-1 text-xs">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                        Excel
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 gap-1 text-xs">
                        <Printer className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
                        Print
                    </Button>
                </div>
            </div>
        </div>
    );
}
