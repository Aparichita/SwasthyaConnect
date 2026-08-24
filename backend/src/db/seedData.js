import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./index.js";
import User from "../models/user.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Appointment from "../models/appointment.model.js";
import Feedback from "../models/feedback.model.js";
import Notification from "../models/notification.model.js";
import Gamification from "../models/gamification.model.js";
import Report from "../models/report.model.js";
import AiResult from "../models/airesult.model.js";
import ABHA from "../models/abha.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

dotenv.config();

const DEMO_PASSWORD = "SwasthyaDemo123!";

const seedData = async () => {
  console.warn("WARNING: This seed clears existing demo collections before inserting data.");
  console.warn("Do not run it against a populated database unless that is intentional.\n");

  try {
    const connected = await connectDB();
    if (!connected) throw new Error("MONGO_URI is not configured or MongoDB could not be reached");

    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Feedback.deleteMany({}),
      Appointment.deleteMany({}),
      Notification.deleteMany({}),
      Gamification.deleteMany({}),
      Report.deleteMany({}),
      AiResult.deleteMany({}),
      ABHA.deleteMany({}),
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
    ]);

    const patients = await Patient.create([
      { name: "John Doe", email: "demo.patient@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9876543210", city: "Bengaluru", age: 30, gender: "Male", existing_conditions: ["Asthma"], symptoms: ["Occasional breathlessness", "Seasonal cough"], isVerified: true, isEmailVerified: true, role: "patient" },
      { name: "Jane Smith", email: "jane.smith@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9876543211", city: "Mumbai", age: 25, gender: "Female", existing_conditions: ["Type 2 diabetes"], symptoms: ["Fatigue", "Increased thirst"], isVerified: true, isEmailVerified: true, role: "patient" },
      { name: "Aarav Mehta", email: "aarav.mehta@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9876543212", city: "Delhi", age: 42, gender: "Male", existing_conditions: ["Hypertension"], symptoms: ["Headache"], isVerified: true, isEmailVerified: true, role: "patient" },
      { name: "Ananya Rao", email: "ananya.rao@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9876543213", city: "Hyderabad", age: 35, gender: "Female", existing_conditions: ["Hypothyroidism"], symptoms: ["Low energy"], isVerified: true, isEmailVerified: true, role: "patient" },
    ]);

    const doctors = await Doctor.create([
      { name: "Dr. Rajesh Kumar", email: "demo.doctor@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9123456780", specialization: "Pulmonologist", qualification: "MBBS, MD Pulmonary Medicine", medical_registration_number: "KAR123456", state_medical_council: "Karnataka Medical Council", hospital_name: "BreatheWell Hospital", consultation_type: "Both", experience: 12, verification_status: "fully_verified", consultation_fee: 800, rating: 4.8, total_reviews: 24, isVerified: true, isEmailVerified: true, role: "doctor" },
      { name: "Dr. Priya Sharma", email: "priya.sharma@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9123456781", specialization: "General Physician", qualification: "MBBS, DNB Family Medicine", medical_registration_number: "MAH234567", state_medical_council: "Maharashtra Medical Council", clinic_name: "CareFirst Clinic", consultation_type: "Online", experience: 9, verification_status: "fully_verified", consultation_fee: 600, rating: 4.6, total_reviews: 18, isVerified: true, isEmailVerified: true, role: "doctor" },
      { name: "Dr. Vikram Singh", email: "vikram.singh@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9123456782", specialization: "Cardiologist", qualification: "MBBS, MD, DM Cardiology", medical_registration_number: "DEL345678", state_medical_council: "Delhi Medical Council", hospital_name: "HeartCare Institute", consultation_type: "Both", experience: 15, verification_status: "fully_verified", consultation_fee: 1200, rating: 4.9, total_reviews: 31, isVerified: true, isEmailVerified: true, role: "doctor" },
      { name: "Dr. Meera Nair", email: "meera.nair@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9123456783", specialization: "Endocrinologist", qualification: "MBBS, MD Internal Medicine, DM Endocrinology", medical_registration_number: "TEL456789", state_medical_council: "Telangana State Medical Council", clinic_name: "Balance Endocrine Centre", consultation_type: "Online", experience: 11, verification_status: "fully_verified", consultation_fee: 900, rating: 4.7, total_reviews: 21, isVerified: true, isEmailVerified: true, role: "doctor" },
      { name: "Dr. Arjun Patel", email: "arjun.patel@swasthyaconnect.com", password: DEMO_PASSWORD, phone: "9123456784", specialization: "Dermatologist", qualification: "MBBS, MD Dermatology", medical_registration_number: "GUJ567890", state_medical_council: "Gujarat Medical Council", hospital_name: "ClearSkin Hospital", consultation_type: "Both", experience: 8, verification_status: "partially_verified", consultation_fee: 700, rating: 4.5, total_reviews: 14, isVerified: true, isEmailVerified: true, role: "doctor" },
    ]);

    // Notification documents reference User, while authentication uses Patient/Doctor.
    await User.create([
      ...patients.map((patient) => ({ _id: patient._id, name: patient.name, email: patient.email, phone: patient.phone, password: DEMO_PASSWORD, role: "patient" })),
      ...doctors.map((doctor) => ({ _id: doctor._id, name: doctor.name, email: doctor.email, phone: doctor.phone, password: DEMO_PASSWORD, role: "doctor" })),
    ]);

    const appointments = await Appointment.create([
      { patient: patients[0]._id, doctor: doctors[0]._id, date: new Date("2026-09-02"), time: "10:00 AM", symptoms: "Seasonal breathing difficulty", status: "confirmed" },
      { patient: patients[0]._id, doctor: doctors[1]._id, date: new Date("2026-09-10"), time: "04:30 PM", symptoms: "Routine health consultation", status: "pending" },
      { patient: patients[1]._id, doctor: doctors[3]._id, date: new Date("2026-09-04"), time: "11:30 AM", symptoms: "Blood sugar follow-up", status: "confirmed" },
      { patient: patients[1]._id, doctor: doctors[2]._id, date: new Date("2026-09-15"), time: "02:00 PM", symptoms: "Annual heart screening", status: "pending" },
      { patient: patients[2]._id, doctor: doctors[2]._id, date: new Date("2026-08-20"), time: "09:30 AM", symptoms: "Blood pressure review", status: "completed" },
      { patient: patients[2]._id, doctor: doctors[1]._id, date: new Date("2026-09-18"), time: "01:00 PM", symptoms: "Headache and fatigue", status: "confirmed" },
      { patient: patients[3]._id, doctor: doctors[3]._id, date: new Date("2026-09-07"), time: "03:30 PM", symptoms: "Thyroid medication review", status: "confirmed" },
      { patient: patients[3]._id, doctor: doctors[4]._id, date: new Date("2026-09-22"), time: "05:00 PM", symptoms: "Skin irritation", status: "pending" },
    ]);

    await Feedback.create([
      { patient: patients[0]._id, doctor: doctors[0]._id, rating: 5, comment: "Very clear and reassuring consultation." },
      { patient: patients[1]._id, doctor: doctors[3]._id, rating: 4, comment: "Helpful guidance and practical next steps." },
      { patient: patients[2]._id, doctor: doctors[2]._id, rating: 5, comment: "Thorough review and excellent follow-up." },
      { patient: patients[3]._id, doctor: doctors[4]._id, rating: 4, comment: "Friendly consultation with useful advice." },
    ]);

    await Notification.create([
      { userId: patients[0]._id, title: "Appointment confirmed", message: "Your appointment with Dr. Rajesh Kumar is confirmed.", type: "appointment" },
      { userId: patients[0]._id, title: "Health report ready", message: "Your latest health report is ready to review.", type: "report", isRead: true },
      { userId: patients[1]._id, title: "Upcoming consultation", message: "Your endocrinology appointment is coming up soon.", type: "appointment" },
      { userId: patients[2]._id, title: "Keep tracking your health", message: "Remember to log your blood pressure this week.", type: "general" },
      { userId: patients[3]._id, title: "Feedback received", message: "Thank you for sharing your experience.", type: "feedback" },
      { userId: doctors[0]._id, title: "New appointment request", message: "John Doe requested a consultation.", type: "appointment" },
      { userId: doctors[2]._id, title: "Appointment completed", message: "A patient marked their appointment as completed.", type: "appointment", isRead: true },
      { userId: doctors[3]._id, title: "New patient feedback", message: "You received new feedback from a patient.", type: "feedback" },
    ]);

    await Gamification.create(patients.map((patient, index) => ({
      patient: patient._id,
      totalPoints: 140 + index * 65,
      level: index + 2,
      pointsForNextLevel: 160,
      achievements: [{ type: "daily_log", points: 10 }, { type: "appointment_booking", points: 25 }, { type: "health_goal", points: 30 }],
      streak: { currentStreak: 4 + index, longestStreak: 8 + index, lastActivityDate: new Date() },
      dailyActivities: [{ date: new Date(), activities: [{ type: "log", points: 10, timestamp: new Date() }, { type: "appointment", points: 25, timestamp: new Date() }], totalPoints: 35 }],
      activeGoals: [{ goalType: index % 2 ? "medication" : "exercise", target: index % 2 ? "Take medication daily" : "Walk 30 minutes", currentProgress: "70%", deadline: new Date("2026-12-31"), pointsReward: 50, status: "active" }],
    })));

    await Report.create([
      { patient: patients[0]._id, doctor: doctors[0]._id, reportName: "Pulmonary Function Test", reportType: "Lab Report", description: "Baseline breathing assessment.", fileUrl: "https://example.com/demo/pulmonary-function-test.pdf", fileType: "pdf", aiInsights: "Mild seasonal pattern noted; discuss results with your doctor." },
      { patient: patients[0]._id, doctor: doctors[1]._id, reportName: "Annual Health Check", description: "Routine annual screening report.", fileUrl: "https://example.com/demo/annual-health-check.pdf", fileType: "pdf" },
      { patient: patients[1]._id, doctor: doctors[3]._id, reportName: "Blood Sugar Panel", reportType: "Lab Report", description: "Fasting and post-meal sugar readings.", fileUrl: "https://example.com/demo/blood-sugar-panel.pdf", fileType: "pdf", aiInsights: "Continue monitoring and follow the care plan." },
      { patient: patients[2]._id, doctor: doctors[2]._id, reportName: "Blood Pressure Log", reportType: "Health Record", description: "Four-week home readings.", fileUrl: "https://example.com/demo/blood-pressure-log.pdf", fileType: "pdf" },
      { patient: patients[3]._id, doctor: doctors[3]._id, reportName: "Thyroid Profile", reportType: "Lab Report", description: "Recent thyroid function results.", fileUrl: "https://example.com/demo/thyroid-profile.pdf", fileType: "pdf", aiInsights: "Review medication dosage at the next appointment." },
      { patient: patients[3]._id, doctor: doctors[4]._id, reportName: "Dermatology Notes", reportType: "Prescription", description: "Consultation notes and care instructions.", fileUrl: "https://example.com/demo/dermatology-notes.pdf", fileType: "pdf" },
    ]);

    await AiResult.create([
      { patient: patients[0]._id, inputData: { symptoms: patients[0].symptoms, location: patients[0].city }, prediction: { riskScore: 0.34, advice: "Monitor breathing symptoms and avoid known triggers." } },
      { patient: patients[1]._id, inputData: { symptoms: patients[1].symptoms, location: patients[1].city }, prediction: { riskScore: 0.58, advice: "Track glucose readings and maintain regular follow-up." } },
      { patient: patients[2]._id, inputData: { symptoms: patients[2].symptoms, location: patients[2].city }, prediction: { riskScore: 0.46, advice: "Continue blood pressure monitoring and daily activity." } },
      { patient: patients[3]._id, inputData: { symptoms: patients[3].symptoms, location: patients[3].city }, prediction: { riskScore: 0.29, advice: "Keep medication records and attend the planned review." } },
    ]);

    await ABHA.create([
      { patient: patients[0]._id, abhaNumber: "12-3456-7890-1234", abhaAddress: "john.doe@abdm", name: patients[0].name, gender: "M", dateOfBirth: new Date("1996-04-12"), mobile: "9876543210", email: patients[0].email, consentStatus: "granted", isVerified: true },
      { patient: patients[1]._id, abhaNumber: "23-4567-8901-2345", abhaAddress: "jane.smith@abdm", name: patients[1].name, gender: "F", dateOfBirth: new Date("2001-08-25"), mobile: "9876543211", email: patients[1].email, consentStatus: "granted", isVerified: true },
      { patient: patients[2]._id, abhaNumber: "34-5678-9012-3456", abhaAddress: "aarav.mehta@abdm", name: patients[2].name, gender: "M", dateOfBirth: new Date("1984-01-19"), mobile: "9876543212", email: patients[2].email, consentStatus: "pending" },
    ]);

    const conversations = await Conversation.create([
      { doctor: doctors[0]._id, patient: patients[0]._id, appointment: appointments[0]._id, lastMessage: "Please bring your previous reports.", lastMessageAt: new Date() },
      { doctor: doctors[3]._id, patient: patients[1]._id, appointment: appointments[2]._id, lastMessage: "Your readings are improving.", lastMessageAt: new Date() },
      { doctor: doctors[2]._id, patient: patients[2]._id, appointment: appointments[4]._id, lastMessage: "See you at the follow-up.", lastMessageAt: new Date(), unreadCount: { doctor: 0, patient: 1 } },
      { doctor: doctors[3]._id, patient: patients[3]._id, appointment: appointments[6]._id, lastMessage: "Please continue your current plan.", lastMessageAt: new Date() },
    ]);

    await Message.create([
      { conversation: conversations[0]._id, senderRole: "patient", senderId: patients[0]._id, messageText: "I have uploaded my breathing test.", messageType: "text", isRead: true },
      { conversation: conversations[0]._id, senderRole: "doctor", senderId: doctors[0]._id, messageText: "Please bring your previous reports.", messageType: "text" },
      { conversation: conversations[1]._id, senderRole: "patient", senderId: patients[1]._id, messageText: "My fasting reading was 108 today.", messageType: "text", isRead: true },
      { conversation: conversations[1]._id, senderRole: "doctor", senderId: doctors[3]._id, messageText: "Your readings are improving.", messageType: "text" },
      { conversation: conversations[2]._id, senderRole: "patient", senderId: patients[2]._id, messageText: "Should I continue the same routine?", messageType: "text", isRead: false },
      { conversation: conversations[2]._id, senderRole: "doctor", senderId: doctors[2]._id, messageText: "See you at the follow-up.", messageType: "text", isRead: true },
      { conversation: conversations[3]._id, senderRole: "patient", senderId: patients[3]._id, messageText: "The medication is working well.", messageType: "text", isRead: true },
      { conversation: conversations[3]._id, senderRole: "doctor", senderId: doctors[3]._id, messageText: "Please continue your current plan.", messageType: "text" },
    ]);

    console.log("\nSeed data created successfully.");
    console.log("Created: 4 patients, 5 doctors, 8 appointments, 4 feedback entries, 8 notifications, 4 gamification profiles, 6 reports, 4 AI results, 3 ABHA records, 4 conversations, and 8 messages.");
    console.log("\nDemo credentials:");
    console.log(`Patient: demo.patient@swasthyaconnect.com / ${DEMO_PASSWORD}`);
    console.log(`Doctor:  demo.doctor@swasthyaconnect.com / ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedData();
