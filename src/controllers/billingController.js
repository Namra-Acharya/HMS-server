import { BillingRecord } from '../database.js';

const formatBilling = (record) => {
  const recordObj = record.toObject();
  return { ...recordObj, id: recordObj._id.toString() };
};

const calculateBilling = (admissionDate, dischargeDate, nurseCharge, hospitalCharge, visitCharge, icuCharge, referenceDoctorCharge, roomCharge) => {
  const admission = new Date(admissionDate);
  const discharge = new Date(dischargeDate);
  let totalDays = Math.ceil((discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));

  // Ensure minimum 1 day BEFORE calculation
  totalDays = Math.max(totalDays, 1);

  const total =
    nurseCharge * totalDays +
    hospitalCharge * totalDays +
    visitCharge +
    icuCharge * totalDays +
    referenceDoctorCharge +
    roomCharge * totalDays;

  return {
    totalDays: totalDays,
    totalAmount: Math.max(total, 0)
  };
};

export const createBillingRecord = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      admissionDate,
      dischargeDate,
      nurseCharge,
      hospitalCharge,
      visitCharge,
      icuCharge,
      referenceDoctorCharge,
      roomCharge,
      status
    } = req.body;

    const { totalDays, totalAmount } = calculateBilling(
      admissionDate,
      dischargeDate,
      nurseCharge || 0,
      hospitalCharge || 0,
      visitCharge || 0,
      icuCharge || 0,
      referenceDoctorCharge || 0,
      roomCharge || 0
    );

    const billingRecord = new BillingRecord({
      patientId,
      patientName,
      admissionDate,
      dischargeDate,
      nurseCharge: nurseCharge || 0,
      hospitalCharge: hospitalCharge || 0,
      visitCharge: visitCharge || 0,
      icuCharge: icuCharge || 0,
      referenceDoctorCharge: referenceDoctorCharge || 0,
      roomCharge: roomCharge || 0,
      totalDays,
      totalAmount,
      status: status || 'Pending'
    });

    await billingRecord.save();
    res.json({ success: true, data: formatBilling(billingRecord), message: 'Billing record created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillingRecords = async (req, res) => {
  try {
    const { patientId, search, isArchived } = req.query;

    let query = {};
    if (isArchived === 'true') query.isArchived = true;
    else if (isArchived === 'false') query.isArchived = false;

    if (patientId) query.patientId = patientId;

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await BillingRecord.find(query).sort({ createdAt: -1 });
    const recordsWithId = records.map(formatBilling);
    res.json({ success: true, data: recordsWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillingById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await BillingRecord.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Billing record not found' });
    }

    res.json({ success: true, data: formatBilling(record) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBillingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const record = await BillingRecord.findByIdAndUpdate(id, updates, { new: true });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Billing record not found' });
    }

    res.json({ success: true, data: formatBilling(record), message: 'Billing record updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBillingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, error: 'Invalid billing record ID' });
    }
    await BillingRecord.findByIdAndDelete(id);
    res.json({ success: true, message: 'Billing record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
