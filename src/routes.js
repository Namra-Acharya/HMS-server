import express from 'express';
import * as patientController from './controllers/patientController.js';
import * as doctorController from './controllers/doctorController.js';
import * as nurseController from './controllers/nurseController.js';
import * as billingController from './controllers/billingController.js';
import * as dashboardController from './controllers/dashboardController.js';
import * as archiveController from './controllers/archiveController.js';

// Use memory-based auth controller (works without MongoDB)
import * as authController from './controllers/authControllerMemory.js';

const router = express.Router();

// Authentication Routes
router.post('/auth/initialize-password', authController.initializePassword);
router.post('/auth/verify-password', authController.verifyPassword);
router.get('/auth/check-password', authController.checkPasswordSet);
router.post('/auth/change-password', authController.changePassword);

// Patient Routes
router.post('/patients', patientController.createPatient);
router.get('/patients', patientController.getPatients);
router.get('/patients/:id', patientController.getPatientById);
router.put('/patients/:id', patientController.updatePatient);
router.post('/patients/:id/discharge', patientController.dischargePatient);
router.delete('/patients/:id', patientController.deletePatient);

// Doctor Routes
router.post('/doctors', doctorController.createDoctor);
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.put('/doctors/:id', doctorController.updateDoctor);
router.delete('/doctors/:id', doctorController.deleteDoctor);

// Nurse Routes
router.post('/nurses', nurseController.createNurse);
router.get('/nurses', nurseController.getNurses);
router.get('/nurses/:id', nurseController.getNurseById);
router.put('/nurses/:id', nurseController.updateNurse);
router.delete('/nurses/:id', nurseController.deleteNurse);

// Nurse Work Chart Routes
router.post('/work-chart', nurseController.addNurseWorkChart);
router.get('/work-chart', nurseController.getNurseWorkChart);

// Billing Routes
router.post('/billing', billingController.createBillingRecord);
router.get('/billing', billingController.getBillingRecords);
router.get('/billing/:id', billingController.getBillingById);
router.put('/billing/:id', billingController.updateBillingRecord);
router.delete('/billing/:id', billingController.deleteBillingRecord);

// Dashboard Routes
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/recent-patients', dashboardController.getRecentPatients);
router.get('/dashboard/daily-report', dashboardController.getDailyReport);

// Archive Routes
router.get('/archives', archiveController.getMonthlyArchives);
router.get('/archives/:month', archiveController.getMonthlyData);
router.post('/archives', archiveController.archiveMonthlyData);
router.get('/archives/:month/pdf', archiveController.generateMonthlyPDF);
router.delete('/archives/:month', archiveController.deleteMonthlyData);

export default router;
