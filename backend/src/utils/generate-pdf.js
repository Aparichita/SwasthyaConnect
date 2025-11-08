import PDFDocument from "pdfkit";
import fs from "fs";

export const generatePDF = (reportData, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc.fontSize(16).text("-------------------------------", { align: "center" });
      doc.fontSize(20).text("SWASTHYA CONNECT", { align: "center" });
      doc.fontSize(16).text("Healthcare Report", { align: "center" });
      doc.fontSize(16).text("-------------------------------", { align: "center" });
      doc.moveDown();

      // Patient Details
      const patientName = reportData.patientName && reportData.patientName.trim() ? reportData.patientName : "N/A";
      const email = reportData.email && reportData.email.trim() ? reportData.email : "N/A";
      const city = reportData.city && reportData.city.trim() ? reportData.city : "N/A";
      const age = reportData.age && reportData.age.toString().trim() ? reportData.age : "N/A";
      
      doc.fontSize(12).text(`Patient Name: ${patientName}`);
      doc.text(`Email: ${email}`);
      doc.text(`City: ${city}`);
      doc.text(`Age: ${age}`);
      doc.moveDown();

      // Appointments
      doc.text("Appointments Summary:");
      if (reportData.appointments && reportData.appointments.length > 0) {
        reportData.appointments.forEach(appt => {
          doc.text(`- ${appt.date}: Dr. ${appt.doctor} – ${appt.status}`);
        });
      } else {
        doc.text("- No appointments found");
      }
      doc.moveDown();

      // Health Advice
      doc.text("Health Advice:");
      if (reportData.healthAdvice && reportData.healthAdvice.length > 0) {
        reportData.healthAdvice.forEach(advice => {
          doc.text(`- ${advice}`);
        });
      } else {
        doc.text("- No health advice available");
      }
      doc.moveDown();

      // Footer
      doc.text(`Report Generated: ${reportData.generatedAt}`);
      doc.text("-------------------------------", { align: "center" });

      doc.end();

      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
