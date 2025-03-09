// src/middleware/upload.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create upload directory if it doesn'taxAnalysis.model.ts exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dynamically create folder structure (by year and month)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const dir = path.join(uploadDir, String(year), month);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG, Excel, and Word documents are allowed.'));
  }
};

// Configure upload limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size
};

// Create multer instance
export const upload = multer({ 
  storage,
  fileFilter,
  limits
});

// Export upload middleware
export default upload;