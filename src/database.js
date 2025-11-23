import mongoose from 'mongoose';

function getMongURI() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Error: MONGO_URI environment variable is not set');
    throw new Error('MONGO_URI environment variable is not set');
  }
  return uri;
}

// Patient Schema
const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    disease: { type: String, required: true },
    symptoms: { type: String, required: true },
    department: { type: String, required: true },
    room: { type: String, required: true },
    assignedDoctor: { type: String },
    referenceDoctor: { type: String },
    admissionType: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    dischargeDate: { type: Date },
    status: { type: String, required: true, default: 'Admitted' },
    isArchived: { type: Boolean, default: false },
    archivedMonth: { type: String },
    uniqueId: { type: String, unique: true, sparse: true },
    weight: { type: Number },
    height: { type: Number },
    bloodPressure: { type: String }
  },
  { timestamps: true }
);

// Counter Schema for unique ID generation
const counterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: Number
});

// Doctor Schema
const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    qualifications: { type: String, required: true },
    availability: { type: String, required: true },
    isArchived: { type: Boolean, default: false },
    archivedMonth: { type: String }
  },
  { timestamps: true }
);

// Nurse Schema
const nurseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    shift: { type: String, required: true },
    ward: { type: String, required: true },
    assignedPatients: [{ type: String }],
    isArchived: { type: Boolean, default: false },
    archivedMonth: { type: String }
  },
  { timestamps: true }
);

// Nurse Work Chart Schema
const nurseWorkChartSchema = new mongoose.Schema(
  {
    nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
    nurseName: { type: String, required: true },
    ward: { type: String, required: true },
    shift: { type: String, required: true },
    date: { type: Date, required: true },
    tasks: { type: String },
    doctorObservations: { type: String },
    isArchived: { type: Boolean, default: false },
    archivedMonth: { type: String }
  },
  { timestamps: true }
);

// Billing Record Schema
const billingRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    dischargeDate: { type: Date, required: true },
    nurseCharge: { type: Number, required: true },
    hospitalCharge: { type: Number, required: true },
    visitCharge: { type: Number, required: true },
    icuCharge: { type: Number, required: true },
    referenceDoctorCharge: { type: Number, required: true },
    roomCharge: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    isArchived: { type: Boolean, default: false },
    archivedMonth: { type: String }
  },
  { timestamps: true }
);

// Monthly Archive Schema
const monthlyArchiveSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, unique: true },
    patientCount: { type: Number, default: 0 },
    billingTotal: { type: Number, default: 0 },
    pdfPath: { type: String },
    pdfData: { type: Buffer },
    deleteOption: { type: String, enum: ['auto', 'manual'], default: 'manual' },
    createdAt: { type: Date, default: Date.now },
    archivedAt: { type: Date }
  }
);

// Settings Schema
const settingsSchema = new mongoose.Schema(
  {
    password: { type: String },
    passwordSet: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Create models
export const Patient = mongoose.model('Patient', patientSchema);
export const Doctor = mongoose.model('Doctor', doctorSchema);
export const Nurse = mongoose.model('Nurse', nurseSchema);
export const NurseWorkChart = mongoose.model('NurseWorkChart', nurseWorkChartSchema);
export const BillingRecord = mongoose.model('BillingRecord', billingRecordSchema);
export const MonthlyArchive = mongoose.model('MonthlyArchive', monthlyArchiveSchema);
export const Counter = mongoose.model('Counter', counterSchema);
export const Settings = mongoose.model('Settings', settingsSchema);

// Function to generate unique ID
export async function generateUniqueId() {
  const counter = await Counter.findByIdAndUpdate(
    'patientId',
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return `PAT${String(counter.sequence_value).padStart(6, '0')}`;
}

// Initialize Database Connection
export async function initializeDatabase() {
  try {
    const MONGO_URI = getMongURI();

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    // Create indexes
    await Patient.collection.createIndex({ admissionDate: 1 }).catch(() => {});
    await Patient.collection.createIndex({ status: 1 }).catch(() => {});
    await BillingRecord.collection.createIndex({ patientId: 1 }).catch(() => {});
    await NurseWorkChart.collection.createIndex({ date: 1 }).catch(() => {});

    return true;
  } catch (error) {
    if (error.message && error.message.includes('existing index has the same name')) {
      return true;
    }

    console.error('Database connection failed:', error.message);
    throw error;
  }
}

export default mongoose;
