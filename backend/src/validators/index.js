// src/middleware/validators/index.js

// Auth validators
export { loginValidator, registerPatientValidator, registerDoctorValidator } from "./auth.validator.js";

// Patient validators (if you create any specific)
export { updatePatientValidator } from "./patient.validator.js";

// Doctor validators
export { registerDoctorValidator as doctorRegisterValidator, updateDoctorValidator } from "./doctor.validator.js";

// Appointment validators
export {
  createAppointmentValidator,
  updateAppointmentStatusValidator,
  deleteAppointmentValidator,
} from "./appointment.validator.js";

// Feedback validators
export {
  createFeedbackValidator,
  deleteFeedbackValidator,
} from "./feedback.validator.js";

// Report validators
export {
  uploadReportValidator,
  deleteReportValidator,
} from "./report.validator.js";

// Notification validators
export {
  createNotificationValidator,
  markNotificationReadValidator,
  deleteNotificationValidator,
} from "./notification.validator.js";
