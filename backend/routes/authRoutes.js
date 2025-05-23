const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Route definitions only

router.post('/login', authController.login);
router.get('/verify/:userId', authController.verifyRegistration);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/register', upload.single('document'), authController.register);

// Protected route - requires authentication
router.get('/user-profile', auth, authController.getUserProfile);


module.exports = router;
