// src/db/seedData.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./index.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing users
    await Patient.deleteMany();
    await Doctor.deleteMany();

    // Seed Patients
    const patients = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: await bcrypt.hash("123456", 10),
        city: "Bangalore",
        age: 30,
        role: "patient",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: await bcrypt.hash("123456", 10),
        city: "Mumbai",
        age: 25,
        role: "patient",
      },
    ];

    // Seed Doctors
    const doctors = [
      {
        name: "Dr. Rajesh",
        email: "rajesh@example.com",
        password: await bcrypt.hash("123456", 10),
        specialization: "Pulmonologist",
        role: "doctor",
      },
      {
        name: "Dr. Priya",
        email: "priya@example.com",
        password: await bcrypt.hash("123456", 10),
        specialization: "General Physician",
        role: "doctor",
      },
    ];

    await Patient.insertMany(patients);
    await Doctor.insertMany(doctors);

    console.log("Seed data created successfully");
    process.exit();
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
};

seedData();
