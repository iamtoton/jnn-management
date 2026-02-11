const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Student Model
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  aadharNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  address: {
    type: DataTypes.TEXT
  },
  contactNumber: {
    type: DataTypes.STRING
  },
  course: {
    type: DataTypes.ENUM('DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'),
    allowNull: false
  },
  photoPath: {
    type: DataTypes.STRING
  },
  admissionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Fee Payment Model
const FeePayment = sequelize.define('FeePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Student,
      key: 'id'
    }
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Settings Model
const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instituteName: {
    type: DataTypes.STRING,
    defaultValue: 'Jawaharlal Nehru National Youth Centre'
  },
  instituteAddress: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  institutePhone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  instituteEmail: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  logoPath: {
    type: DataTypes.STRING
  },
  receiptPrefix: {
    type: DataTypes.STRING,
    defaultValue: 'JNN'
  }
});

// Define relationships
Student.hasMany(FeePayment, { foreignKey: 'studentId', as: 'feePayments' });
FeePayment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Initialize database
async function initDatabase() {
  try {
    await sequelize.sync();
    
    // Create default settings if none exist
    const settingsCount = await Setting.count();
    if (settingsCount === 0) {
      await Setting.create({
        instituteName: 'Jawaharlal Nehru National Youth Centre',
        instituteAddress: 'Your Institute Address Here',
        institutePhone: '',
        instituteEmail: '',
        receiptPrefix: 'JNN'
      });
    }
    
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database synchronization failed:', error);
  }
}

module.exports = {
  sequelize,
  Student,
  FeePayment,
  Setting,
  initDatabase
};
