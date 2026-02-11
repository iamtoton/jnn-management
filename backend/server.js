const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Student, FeePayment, Setting, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://jnn-frontend.onrender.com', 'https://jnn-frontend.vercel.app', process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ===== STUDENT ROUTES =====

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const { search, course, isActive } = req.query;
    const whereClause = {};
    
    if (course) whereClause.course = course;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const students = await Student.findAll({
      where: whereClause,
      include: [{
        model: FeePayment,
        as: 'feePayments',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Filter by search term if provided
    let result = students;
    if (search) {
      const searchLower = search.toLowerCase();
      result = students.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.fatherName.toLowerCase().includes(searchLower) ||
        s.contactNumber?.includes(search) ||
        s.aadharNumber?.includes(search)
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{
        model: FeePayment,
        as: 'feePayments',
        order: [['paymentDate', 'DESC']]
      }]
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student
app.post('/api/students', upload.single('photo'), async (req, res) => {
  try {
    const { name, fatherName, aadharNumber, address, contactNumber, course, admissionDate } = req.body;
    
    const studentData = {
      name,
      fatherName,
      aadharNumber,
      address,
      contactNumber,
      course,
      photoPath: req.file ? `/uploads/${req.file.filename}` : null,
      admissionDate: admissionDate || new Date()
    };
    
    const student = await Student.create(studentData);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
app.put('/api/students/:id', upload.single('photo'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const { name, fatherName, aadharNumber, address, contactNumber, course, isActive } = req.body;
    
    const updateData = {
      name,
      fatherName,
      aadharNumber,
      address,
      contactNumber,
      course,
      isActive: isActive !== undefined ? isActive : student.isActive
    };
    
    if (req.file) {
      // Delete old photo if exists
      if (student.photoPath) {
        const oldPhotoPath = path.join(__dirname, student.photoPath);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photoPath = `/uploads/${req.file.filename}`;
    }
    
    await student.update(updateData);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Delete photo if exists
    if (student.photoPath) {
      const photoPath = path.join(__dirname, student.photoPath);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    await student.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ===== FEE ROUTES =====

// Get all fee payments
app.get('/api/fees', async (req, res) => {
  try {
    const { studentId, month, year, startDate, endDate } = req.query;
    const whereClause = {};
    
    if (studentId) whereClause.studentId = studentId;
    if (month) whereClause.month = month;
    if (year) whereClause.year = parseInt(year);
    
    if (startDate && endDate) {
      whereClause.paymentDate = {
        [require('sequelize').Op.gte]: new Date(startDate),
        [require('sequelize').Op.lte]: new Date(endDate)
      };
    }
    
    const payments = await FeePayment.findAll({
      where: whereClause,
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'fatherName', 'course']
      }],
      order: [['paymentDate', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching fee payments:', error);
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
});

// Create fee payment
app.post('/api/fees', async (req, res) => {
  try {
    const { studentId, month, year, amount, remarks, paymentDate } = req.body;
    
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const paymentData = {
      studentId,
      month,
      year: parseInt(year),
      amount: parseFloat(amount),
      remarks
    };
    
    // If paymentDate is provided, use it; otherwise, use default (current date)
    if (paymentDate) {
      paymentData.paymentDate = new Date(paymentDate);
    }
    
    const payment = await FeePayment.create(paymentData);
    
    const paymentWithStudent = await FeePayment.findByPk(payment.id, {
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'fatherName', 'course']
      }]
    });
    
    res.status(201).json(paymentWithStudent);
  } catch (error) {
    console.error('Error creating fee payment:', error);
    res.status(500).json({ error: 'Failed to create fee payment' });
  }
});

// Delete fee payment
app.delete('/api/fees/:id', async (req, res) => {
  try {
    const payment = await FeePayment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    await payment.destroy();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// ===== DASHBOARD ROUTES =====

app.get('/api/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Today's collection
    const todayCollection = await FeePayment.sum('amount', {
      where: {
        paymentDate: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      }
    }) || 0;
    
    // Monthly collection
    const monthlyCollection = await FeePayment.sum('amount', {
      where: {
        paymentDate: {
          [require('sequelize').Op.gte]: firstDayOfMonth
        }
      }
    }) || 0;
    
    // Yearly collection
    const yearlyCollection = await FeePayment.sum('amount', {
      where: {
        paymentDate: {
          [require('sequelize').Op.gte]: firstDayOfYear
        }
      }
    }) || 0;
    
    // Total students
    const totalStudents = await Student.count({ where: { isActive: true } });
    
    // Recent transactions
    const recentTransactions = await FeePayment.findAll({
      limit: 10,
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'course']
      }],
      order: [['paymentDate', 'DESC']]
    });
    
    // Monthly stats for chart
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      
      const amount = await FeePayment.sum('amount', {
        where: {
          paymentDate: {
            [require('sequelize').Op.gte]: monthStart,
            [require('sequelize').Op.lt]: monthEnd
          }
        }
      }) || 0;
      
      monthlyStats.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: parseFloat(amount)
      });
    }
    
    res.json({
      stats: {
        todayCollection: parseFloat(todayCollection),
        monthlyCollection: parseFloat(monthlyCollection),
        yearlyCollection: parseFloat(yearlyCollection),
        totalStudents
      },
      recentTransactions,
      monthlyStats
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ===== SETTINGS ROUTES =====

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Setting.findOne();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', upload.single('logo'), async (req, res) => {
  try {
    const settings = await Setting.findOne();
    
    const { instituteName, instituteAddress, institutePhone, instituteEmail, receiptPrefix } = req.body;
    
    const updateData = {
      instituteName,
      instituteAddress,
      institutePhone,
      instituteEmail,
      receiptPrefix
    };
    
    if (req.file) {
      // Delete old logo if exists
      if (settings.logoPath) {
        const oldLogoPath = path.join(__dirname, settings.logoPath);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      updateData.logoPath = `/uploads/${req.file.filename}`;
    }
    
    await settings.update(updateData);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ===== BACKUP ROUTES =====

// Create backup
app.post('/api/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sqlite`;
    const backupPath = path.join(__dirname, 'backups', backupFileName);
    const dbPath = path.join(__dirname, 'database.sqlite');
    
    // Ensure backups directory exists
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    res.json({ 
      message: 'Backup created successfully',
      filename: backupFileName,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// List all backups
app.get('/api/backup', async (req, res) => {
  try {
    const backupsDir = path.join(__dirname, 'backups');
    
    if (!fs.existsSync(backupsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.sqlite'))
      .map(file => {
        const stats = fs.statSync(path.join(backupsDir, file));
        return {
          filename: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB', // Convert to MB
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
    
    res.json(files);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Download backup
app.get('/api/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'backups', filename);
    
    // Security check: ensure file is within backups directory
    if (!backupPath.startsWith(path.join(__dirname, 'backups'))) {
      return res.status(403).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    res.download(backupPath);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

// Restore from backup
app.post('/api/backup/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'backups', filename);
    const dbPath = path.join(__dirname, 'database.sqlite');
    
    // Security check: ensure file is within backups directory
    if (!backupPath.startsWith(path.join(__dirname, 'backups'))) {
      return res.status(403).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    // Create a backup of current database before restoring
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(__dirname, 'backups', `pre-restore-${timestamp}.sqlite`);
    fs.copyFileSync(dbPath, currentBackupPath);
    
    // Restore database
    fs.copyFileSync(backupPath, dbPath);
    
    res.json({ 
      message: 'Database restored successfully',
      restoredFrom: filename,
      previousBackup: `pre-restore-${timestamp}.sqlite`
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Delete backup
app.delete('/api/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'backups', filename);
    
    // Security check: ensure file is within backups directory
    if (!backupPath.startsWith(path.join(__dirname, 'backups'))) {
      return res.status(403).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    fs.unlinkSync(backupPath);
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
