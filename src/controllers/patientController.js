import { Patient, generateUniqueId } from '../database.js';

const formatPatient = (patient) => {
  const patientObj = patient.toObject();
  return { ...patientObj, id: patientObj._id.toString() };
};

export const createPatient = async (req, res) => {
  try {
    const patientData = req.body;
    const uniqueId = await generateUniqueId();
    const patient = new Patient({ ...patientData, uniqueId });
    await patient.save();
    res.json({ success: true, data: formatPatient(patient), message: 'Patient created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPatients = async (req, res) => {
  try {
    const { status, admissionType, search, isArchived } = req.query;

    let query = {};

    if (isArchived === 'true') {
      query.isArchived = true;
    } else if (isArchived === 'false') {
      query.isArchived = false;
    }

    if (status) query.status = status;
    if (admissionType) query.admissionType = admissionType;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    const patientsWithId = patients.map(formatPatient);
    res.json({ success: true, data: patientsWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: formatPatient(patient) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const patient = await Patient.findByIdAndUpdate(id, updates, { new: true });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: formatPatient(patient), message: 'Patient updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByIdAndUpdate(
      id,
      { status: 'Discharged', dischargeDate: new Date() },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: formatPatient(patient), message: 'Patient discharged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, error: 'Invalid patient ID' });
    }

    // Import models for cascade delete
    const { BillingRecord, Nurse } = await import('../database.js');

    // Delete all related billing records
    await BillingRecord.deleteMany({ patientId: id });

    // Remove patient from nurse's assigned patients list
    await Nurse.updateMany(
      { assignedPatients: id },
      { $pull: { assignedPatients: id } }
    );

    // Delete the patient
    await Patient.findByIdAndDelete(id);

    res.json({ success: true, message: 'Patient and all related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
