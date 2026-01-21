// src/middlewares/multer.middleware.js
import multer from 'multer';

const storage = multer.memoryStorage(); // use memoryStorage for Cloudinary upload
const upload = multer({ storage });

export default upload;
