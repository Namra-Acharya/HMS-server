import { Doctor } from '../database.js';

export const createDoctor = async (req, res) => {
  try {
    const doctorData = req.body;
    const doctor = new Doctor(doctorData);
    await doctor.save();
    const docObj = doctor.toObject();
    const docWithId = { ...docObj, id: docObj._id.toString() };
    res.json({ success: true, data: docWithId, message: 'Doctor created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const { search, isArchived } = req.query;

    let query = {};
    if (isArchived === 'true') query.isArchived = true;
    else if (isArchived === 'false') query.isArchived = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query).sort({ createdAt: -1 });
    const doctorsWithId = doctors.map(doc => {
      const docObj = doc.toObject();
      return { ...docObj, id: docObj._id.toString() };
    });
    res.json({ success: true, data: doctorsWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const docObj = doctor.toObject();
    const docWithId = { ...docObj, id: docObj._id.toString() };
    res.json({ success: true, data: docWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, updates, { new: true });

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const docObj = doctor.toObject();
    const docWithId = { ...docObj, id: docObj._id.toString() };
    res.json({ success: true, data: docWithId, message: 'Doctor updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID' });
    }
    await Doctor.findByIdAndDelete(id);
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
