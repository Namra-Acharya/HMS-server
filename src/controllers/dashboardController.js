import { Patient, Doctor, Nurse, BillingRecord } from '../database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalOPDPatients = await Patient.countDocuments({ admissionType: 'OPD', isArchived: false });
    const totalIPDPatients = await Patient.countDocuments({ admissionType: 'IPD', isArchived: false });
    const icuOccupiedBeds = await Patient.countDocuments({ admissionType: 'ICU', isArchived: false });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const admissionsToday = await Patient.countDocuments({
      admissionDate: { $gte: today, $lt: tomorrow },
      isArchived: false
    });

    const dischargesToday = await Patient.countDocuments({
      dischargeDate: { $gte: today, $lt: tomorrow },
      status: 'Discharged',
      isArchived: false
    });

    const totalDoctors = await Doctor.countDocuments({ isArchived: false });
    const totalNurses = await Nurse.countDocuments({ isArchived: false });

    const billingRecords = await BillingRecord.find({ isArchived: false });
    const totalRevenue = billingRecords.reduce((sum, bill) => sum + bill.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalOPDPatients,
        totalIPDPatients,
        icuOccupiedBeds,
        admissionsToday,
        dischargesToday,
        totalDoctors,
        totalNurses,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRecentPatients = async (req, res) => {
  try {
    const patients = await Patient.find({
      status: 'Admitted',
      isArchived: false
    })
      .sort({ admissionDate: -1 })
      .limit(10);

    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date parameter is required' });
    }

    const reportDate = new Date(date);
    const nextDate = new Date(reportDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const admittedCount = await Patient.countDocuments({
      admissionDate: { $gte: reportDate, $lt: nextDate },
      isArchived: false
    });

    const dischargedCount = await Patient.countDocuments({
      dischargeDate: { $gte: reportDate, $lt: nextDate },
      status: 'Discharged',
      isArchived: false
    });

    const billingRecords = await BillingRecord.find({
      createdAt: { $gte: reportDate, $lt: nextDate },
      isArchived: false
    });

    const dailyRevenue = billingRecords.reduce((sum, bill) => sum + bill.totalAmount, 0);

    res.json({
      success: true,
      data: {
        date: reportDate.toISOString().split('T')[0],
        admittedCount,
        dischargedCount,
        dailyRevenue,
        billingCount: billingRecords.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
