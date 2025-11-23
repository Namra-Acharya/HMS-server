import { Patient, BillingRecord, MonthlyArchive } from '../database.js';
import PDFDocument from 'pdfkit';

export const getMonthlyArchives = async (req, res) => {
  try {
    const archives = await MonthlyArchive.find().sort({ month: -1 });
    res.json({ success: true, data: archives });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMonthlyData = async (req, res) => {
  try {
    const { month } = req.params;

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const patients = await Patient.find({
      admissionDate: { $gte: startDate, $lt: endDate },
      isArchived: true,
      archivedMonth: month
    });

    const billings = await BillingRecord.find({
      admissionDate: { $gte: startDate, $lt: endDate },
      isArchived: true,
      archivedMonth: month
    });

    const workCharts = await NurseWorkChart.find({
      date: { $gte: startDate, $lt: endDate },
      isArchived: true,
      archivedMonth: month
    });

    res.json({
      success: true,
      data: {
        month,
        patientCount: patients.length,
        billingTotal: billings.reduce((sum, b) => sum + b.totalAmount, 0),
        patients,
        billings,
        workCharts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const archiveMonthlyData = async (req, res) => {
  try {
    const { month, deleteOption = 'manual' } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM' });
    }

    if (!['auto', 'manual'].includes(deleteOption)) {
      return res.status(400).json({ success: false, error: 'deleteOption must be "auto" or "manual"' });
    }

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch all data for the month
    const patients = await Patient.find({
      admissionDate: { $gte: startDate, $lt: endDate },
      isArchived: false
    });

    const billings = await BillingRecord.find({
      admissionDate: { $gte: startDate, $lt: endDate },
      isArchived: false
    });

    // Calculate totals
    const patientCount = patients.length;
    const billingTotal = billings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Create or update archive record
    const archive = await MonthlyArchive.findOneAndUpdate(
      { month },
      {
        month,
        patientCount,
        billingTotal,
        archivedAt: new Date(),
        deleteOption
      },
      { upsert: true, new: true }
    );

    // If auto-delete, immediately delete data from collections
    if (deleteOption === 'auto') {
      await Patient.deleteMany({
        _id: { $in: patients.map(p => p._id) }
      });

      await BillingRecord.deleteMany({
        _id: { $in: billings.map(b => b._id) }
      });

      await NurseWorkChart.deleteMany({
        date: { $gte: startDate, $lt: endDate }
      });

      res.json({
        success: true,
        data: archive,
        message: `Successfully archived and deleted ${patientCount} patients and ${billings.length} billing records for ${month}.`,
        deleted: true
      });
    } else {
      // Manual delete - just mark as archived
      await Patient.updateMany(
        { _id: { $in: patients.map(p => p._id) } },
        { isArchived: true, archivedMonth: month }
      );

      await BillingRecord.updateMany(
        { _id: { $in: billings.map(b => b._id) } },
        { isArchived: true, archivedMonth: month }
      );

      await NurseWorkChart.updateMany(
        { date: { $gte: startDate, $lt: endDate } },
        { isArchived: true, archivedMonth: month }
      );

      res.json({
        success: true,
        data: archive,
        message: `Successfully archived ${patientCount} patients and ${billings.length} billing records for ${month}.`,
        deleted: false
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateMonthlyPDF = async (req, res) => {
  try {
    const { month } = req.params;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM' });
    }

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch all data for the month (archived or not)
    const patients = await Patient.find({
      admissionDate: { $gte: startDate, $lt: endDate }
    });

    const billings = await BillingRecord.find({
      admissionDate: { $gte: startDate, $lt: endDate }
    });

    // Create PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Hospital_Archive_${month}.pdf"`);
      res.send(pdfBuffer);
    });

    // Helper function to draw tables
    const drawTable = (doc, headers, rows, columnWidths) => {
      const startX = 30;
      const startY = doc.y;
      const rowHeight = 18;
      const headerHeight = 22;

      // Header
      doc.fontSize(9).font('Helvetica-Bold');
      let currentX = startX;
      headers.forEach((header, index) => {
        doc.rect(currentX, startY, columnWidths[index], headerHeight).stroke();
        doc.text(header, currentX + 2, startY + 4, {
          width: columnWidths[index] - 4,
          height: headerHeight - 8,
          align: 'center',
          valign: 'center'
        });
        currentX += columnWidths[index];
      });

      // Rows
      doc.fontSize(8).font('Helvetica');
      let currentY = startY + headerHeight;

      rows.forEach(row => {
        currentX = startX;
        row.forEach((cell, index) => {
          doc.rect(currentX, currentY, columnWidths[index], rowHeight).stroke();
          doc.text(String(cell || ''), currentX + 2, currentY + 3, {
            width: columnWidths[index] - 4,
            height: rowHeight - 6,
            align: 'left',
            valign: 'top'
          });
          currentX += columnWidths[index];
        });
        currentY += rowHeight;
      });

      doc.y = currentY + 10;
    };

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('🏥 HOSPITAL MONTHLY ARCHIVE', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').text(month, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, { align: 'center' });
    doc.moveTo(30, doc.y + 5).lineTo(565, doc.y + 5).stroke();
    doc.moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('SUMMARY');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Patients: ${patients.length}`);
    doc.text(`Total Billing Records: ${billings.length}`);
    doc.text(`Total Revenue: ₹${billings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString('en-IN')}`);
    doc.moveDown(1);

    // Combined Patient & Billing Records Table
    if (patients.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('PATIENT & BILLING RECORDS');
      doc.moveDown(0.3);

      const combinedRows = patients.map(p => {
        const billing = billings.find(b => b.patientId === p._id || b.patientName === p.name);
        return [
          p.name,
          p.age.toString(),
          p.department,
          new Date(p.admissionDate).toLocaleDateString('en-IN'),
          p.dischargeDate ? new Date(p.dischargeDate).toLocaleDateString('en-IN') : 'Admitted',
          billing ? billing.totalDays.toString() : '-',
          billing ? `₹${billing.totalAmount.toLocaleString('en-IN')}` : '-',
          billing ? (billing.status || 'Pending') : '-'
        ];
      });

      drawTable(doc, ['Patient Name', 'Age', 'Dept', 'Admission', 'Discharge', 'Billing Days', 'Amount', 'Bill Status'], combinedRows, [75, 28, 45, 65, 65, 55, 65, 65]);
      doc.moveDown(0.5);
    }

    doc.moveDown(1);

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMonthlyData = async (req, res) => {
  try {
    const { month } = req.params;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM' });
    }

    // Delete data marked as archived
    const patientResult = await Patient.deleteMany({
      archivedMonth: month,
      isArchived: true
    });

    const billingResult = await BillingRecord.deleteMany({
      archivedMonth: month,
      isArchived: true
    });

    const workChartResult = await NurseWorkChart.deleteMany({
      archivedMonth: month,
      isArchived: true
    });

    res.json({
      success: true,
      message: `Deleted ${patientResult.deletedCount} patients, ${billingResult.deletedCount} billing records, and ${workChartResult.deletedCount} work charts for ${month}. Archive PDF remains in database.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
