import { Nurse, NurseWorkChart } from '../database.js';

const formatNurse = (nurse) => {
  const nurseObj = nurse.toObject();
  return { ...nurseObj, id: nurseObj._id.toString() };
};

const formatChart = (chart) => {
  const chartObj = chart.toObject();
  return { ...chartObj, id: chartObj._id.toString() };
};

export const createNurse = async (req, res) => {
  try {
    const nurseData = req.body;
    const nurse = new Nurse(nurseData);
    await nurse.save();
    res.json({ success: true, data: formatNurse(nurse), message: 'Nurse created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNurses = async (req, res) => {
  try {
    const { search, isArchived } = req.query;

    let query = {};
    if (isArchived === 'true') query.isArchived = true;
    else if (isArchived === 'false') query.isArchived = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ward: { $regex: search, $options: 'i' } }
      ];
    }

    const nurses = await Nurse.find(query).sort({ createdAt: -1 });
    const nursesWithId = nurses.map(formatNurse);
    res.json({ success: true, data: nursesWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNurseById = async (req, res) => {
  try {
    const { id } = req.params;
    const nurse = await Nurse.findById(id);

    if (!nurse) {
      return res.status(404).json({ success: false, error: 'Nurse not found' });
    }

    res.json({ success: true, data: formatNurse(nurse) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const nurse = await Nurse.findByIdAndUpdate(id, updates, { new: true });

    if (!nurse) {
      return res.status(404).json({ success: false, error: 'Nurse not found' });
    }

    res.json({ success: true, data: formatNurse(nurse), message: 'Nurse updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNurse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, error: 'Invalid nurse ID' });
    }
    await Nurse.findByIdAndDelete(id);
    res.json({ success: true, message: 'Nurse deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Nurse Work Chart
export const addNurseWorkChart = async (req, res) => {
  try {
    const chartData = req.body;
    const chart = new NurseWorkChart(chartData);
    await chart.save();
    res.json({ success: true, data: formatChart(chart), message: 'Work chart entry created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNurseWorkChart = async (req, res) => {
  try {
    const { date, month, nurseId, isArchived } = req.query;

    let query = {};
    if (isArchived === 'true') query.isArchived = true;
    else if (isArchived === 'false') query.isArchived = false;

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    } else if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (nurseId) query.nurseId = nurseId;

    const charts = await NurseWorkChart.find(query).sort({ date: -1 });
    const chartsWithId = charts.map(formatChart);
    res.json({ success: true, data: chartsWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
