import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Prospect } from "@/hooks/use-prospects";
import { CallLog } from "@/hooks/use-call-logs";

export interface ExportHelper {
  getStatusLabel: (statusId: string) => string;
  getSourceLabel: (sourceId: string) => string;
  getAssignedToLabel: (userId: string) => string;
}

export const exportToExcel = (
  prospects: Prospect[],
  helper: ExportHelper,
  filename: string = "prospects"
) => {
  const exportData = prospects.map((prospect) => ({
    Name: prospect.name,
    "Phone Number": prospect.phone || prospect.phoneNumber,
    Status: helper.getStatusLabel(prospect.status),
    Source: helper.getSourceLabel(prospect.source),
    "Assigned To": prospect.assignedTo
      ? helper.getAssignedToLabel(prospect.assignedTo)
      : "Unassigned",
    Tags: prospect.tags?.join(", ") || "",
    Notes: prospect.notes || "",
    "Created At": prospect.createdAt
      ? format(prospect.createdAt.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "",
    "Last Updated": prospect.lastUpdated
      ? format(prospect.lastUpdated.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "",
    "Last Contact": prospect.lastContactDate
      ? format(prospect.lastContactDate.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "",
    "Next Follow Up": prospect.nextFollowUpDate
      ? format(prospect.nextFollowUpDate.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");

  // Auto-size columns only if data exists
  if (exportData.length > 0) {
    const maxWidths: { [key: string]: number } = {};
    exportData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = String(row[key as keyof typeof row]);
        maxWidths[key] = Math.max(maxWidths[key] || 0, value.length);
      });
    });

    const colWidths = Object.keys(exportData[0]).map((key) => ({
      wch: Math.min(maxWidths[key] || 10, 30), // Max width of 30 characters
    }));

    worksheet["!cols"] = colWidths;
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (
  prospects: Prospect[],
  helper: ExportHelper,
  filename: string = "prospects"
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text("Prospects Report", 14, 22);

  // Add generation date
  doc.setFontSize(10);
  doc.text(
    `Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
    14,
    30
  );

  // Prepare table data
  const tableData = prospects.map((prospect) => [
    prospect.name,
    prospect.phone || prospect.phoneNumber,
    helper.getStatusLabel(prospect.status),
    helper.getSourceLabel(prospect.source),
    prospect.assignedTo
      ? helper.getAssignedToLabel(prospect.assignedTo)
      : "Unassigned",
    prospect.tags?.join(", ") || "",
    prospect.createdAt ? format(prospect.createdAt.toDate(), "yyyy-MM-dd") : "",
  ]);

  // Add table
  autoTable(doc, {
    head: [
      ["Name", "Phone", "Status", "Source", "Assigned To", "Tags", "Created"],
    ],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Name
      1: { cellWidth: 25 }, // Phone
      2: { cellWidth: 20 }, // Status
      3: { cellWidth: 20 }, // Source
      4: { cellWidth: 25 }, // Assigned To
      5: { cellWidth: 30 }, // Tags
      6: { cellWidth: 25 }, // Created
    },
    margin: { top: 35, left: 14, right: 14 },
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

// Call Logs Export Functions
export interface CallLogExportHelper {
  getAgentLabel: (userId: string) => string;
  getProspectLabel: (prospectId: string) => string;
}

export const exportCallLogsToExcel = (
  callLogs: CallLog[],
  helper: CallLogExportHelper,
  filename: string = "call-logs"
) => {
  const exportData = callLogs.map((log) => ({
    Date: log.startTime ? format(log.startTime.toDate(), "yyyy-MM-dd HH:mm:ss") : "",
    Agent: log.agentId ? helper.getAgentLabel(log.agentId) : "Unknown",
    Prospect: helper.getProspectLabel(log.prospectId),
    Phone: log.phoneNumber || "",
    Status: log.status,
    Duration: log.duration ? `${Math.round(log.duration / 1000)}s` : "0s",
    Disposition: log.disposition || "",
    Notes: log.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Call Logs");

  // Auto-size columns only if data exists
  if (exportData.length > 0) {
    const maxWidths: { [key: string]: number } = {};
    exportData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = String(row[key as keyof typeof row]);
        maxWidths[key] = Math.max(maxWidths[key] || 0, value.length);
      });
    });

    const colWidths = Object.keys(exportData[0]).map((key) => ({
      wch: Math.min(maxWidths[key] || 10, 30), // Max width of 30 characters
    }));

    worksheet["!cols"] = colWidths;
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportCallLogsToPDF = (
  callLogs: CallLog[],
  helper: CallLogExportHelper,
  filename: string = "call-logs"
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text("Call Logs Report", 14, 22);

  // Add generation date
  doc.setFontSize(10);
  doc.text(
    `Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
    14,
    30
  );

  // Prepare table data
  const tableData = callLogs.map((log) => [
    log.startTime ? format(log.startTime.toDate(), "yyyy-MM-dd HH:mm") : "",
    log.agentId ? helper.getAgentLabel(log.agentId) : "Unknown",
    helper.getProspectLabel(log.prospectId),
    log.phoneNumber || "",
    log.status,
    log.duration ? `${Math.round(log.duration / 1000)}s` : "0s",
    log.disposition || "",
  ]);

  // Add table
  autoTable(doc, {
    head: [
      ["Date", "Agent", "Prospect", "Phone", "Status", "Duration", "Disposition"],
    ],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Date
      1: { cellWidth: 25 }, // Agent
      2: { cellWidth: 25 }, // Prospect
      3: { cellWidth: 25 }, // Phone
      4: { cellWidth: 20 }, // Status
      5: { cellWidth: 15 }, // Duration
      6: { cellWidth: 25 }, // Disposition
    },
    margin: { top: 35, left: 14, right: 14 },
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};
