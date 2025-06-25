const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Add debugging to track file uploads and form fields
const upload = multer({ 
  storage,
  // Log all form fields for debugging
  onFileUploadStart: function(file, req, _res) {
    console.log('Upload starting for', file.originalname);
    console.log('Form fields:', req.body);
  },
  // Log when upload is complete
  onFileUploadComplete: function(file, _req, _res) {
    console.log('Upload complete for', file.originalname);
  }
});

module.exports = upload;
