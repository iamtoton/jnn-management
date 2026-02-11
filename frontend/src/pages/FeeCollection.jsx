import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, IndianRupee, Printer, CheckCircle, Loader2, X, Calendar } from 'lucide-react';
import { studentAPI, feeAPI, settingsAPI } from '../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FeeCollection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState(null);
  const receiptRef = useRef(null);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  
  // Check for passed state from Due List or other pages
  useEffect(() => {
    const passedState = location.state;
    if (passedState?.student) {
      // Pre-populate student from navigation state
      setSelectedStudent(passedState.student);
      setSearchQuery(passedState.student.name);
      
      // Pre-populate month and year if passed
      if (passedState.month) {
        setFormData(prev => ({ ...prev, month: passedState.month }));
      }
      if (passedState.year) {
        setFormData(prev => ({ ...prev, year: passedState.year }));
      }
      
      // Clear the location state to prevent re-population on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);
  
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    year: currentYear,
    amount: '',
    remarks: '',
    paymentDate: new Date().toISOString().split('T')[0] // Default to today
  });

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && !selectedStudent) {
        searchStudents();
      } else if (!searchQuery.trim()) {
        setStudents([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedStudent]);

  const searchStudents = async () => {
    try {
      setSearching(true);
      const response = await studentAPI.getAll({ search: searchQuery, isActive: true });
      setStudents(response.data.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setStudents([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !formData.amount) {
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        studentId: selectedStudent.id,
        month: formData.month,
        year: parseInt(formData.year),
        amount: parseFloat(formData.amount),
        remarks: formData.remarks,
        paymentDate: formData.paymentDate // Include the selected payment date
      };
      
      await feeAPI.create(paymentData);
      setSuccess(true);
      // Don't show receipt immediately - show success message first
    } catch (error) {
      console.error('Error collecting fee:', error);
      alert('Failed to collect fee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Open receipt in new window for proper A5 landscape printing
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedStudent) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${selectedStudent.name}</title>
        <style>
          @page {
            size: A5 landscape;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            padding: 0;
            margin: 0;
            font-size: 11px;
          }
          .receipt {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            height: 118mm;
            max-height: 118mm;
            overflow: hidden;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            margin-bottom: 10px;
            text-align: center;
          }
          .logo {
            position: absolute;
            left: 0;
            top: 0;
            max-height: 40px;
            max-width: 60px;
            object-fit: contain;
          }
          .header-content {
            flex: 1;
          }
          .institute-name {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .receipt-title {
            font-size: 11px;
            font-weight: bold;
            padding: 2px 10px;
            background: #333;
            color: white;
            display: inline-block;
            border-radius: 3px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 6px 8px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .receipt-info-label {
            font-weight: bold;
            color: #555;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
            padding: 10px;
            background: #fafafa;
            border: 1px solid #ddd;
            border-radius: 6px;
          }
          .student-info-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 1px;
          }
          .student-info-value {
            font-weight: bold;
            font-size: 12px;
          }
          .payment-details {
            margin-bottom: 10px;
            padding: 10px;
            background: #f0fff4;
            border: 2px solid #48bb78;
            border-radius: 6px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .payment-for-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
          }
          .payment-for-value {
            font-weight: bold;
            font-size: 13px;
          }
          .payment-amount {
            text-align: right;
          }
          .payment-amount-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
          }
          .payment-amount-value {
            font-size: 20px;
            font-weight: bold;
            color: #22543d;
          }
          .remarks {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #ccc;
            font-size: 10px;
          }
          .remarks-label {
            font-weight: bold;
            color: #666;
          }
          .footer {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .note {
            font-size: 9px;
            color: #666;
          }
          .signature {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            width: 140px;
            margin-bottom: 2px;
            padding-top: 2px;
          }
          .signature-text {
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${settings?.logoPath ? `<img src="${settings.logoPath}" alt="Logo" class="logo" />` : ''}
            <div class="header-content">
              <div class="institute-name">${settings?.instituteName || 'JAWAHARLAL NEHRU NATIONAL YOUTH CENTRE'}</div>
              <div class="receipt-title">FEE PAYMENT RECEIPT</div>
            </div>
          </div>

          <div class="receipt-info">
            <div>
              <span class="receipt-info-label">Receipt No:</span> REC-${Date.now().toString().slice(-8).toUpperCase()}
            </div>
            <div>
              <span class="receipt-info-label">Date:</span> ${new Date(formData.paymentDate).toLocaleDateString('en-IN')}
            </div>
          </div>

          <div class="student-info">
            <div>
              <div class="student-info-label">Student Name</div>
              <div class="student-info-value">${selectedStudent.name}</div>
            </div>
            <div>
              <div class="student-info-label">Course</div>
              <div class="student-info-value">${selectedStudent.course}</div>
            </div>
            <div>
              <div class="student-info-label">Father's Name</div>
              <div class="student-info-value">${selectedStudent.fatherName}</div>
            </div>
            <div>
              <div class="student-info-label">Contact Number</div>
              <div class="student-info-value">${selectedStudent.contactNumber || 'N/A'}</div>
            </div>
          </div>

          <div class="payment-details">
            <div class="payment-row">
              <div>
                <div class="payment-for-label">Payment For</div>
                <div class="payment-for-value">${formData.month} ${formData.year}</div>
              </div>
              <div class="payment-amount">
                <div class="payment-amount-label">Amount Paid</div>
                <div class="payment-amount-value">₹${parseFloat(formData.amount).toFixed(2)}</div>
              </div>
            </div>
            ${formData.remarks ? `
            <div class="remarks">
              <span class="remarks-label">Remarks:</span> ${formData.remarks}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="note">
              <p>This is a computer generated receipt.</p>
              <p>Thank you for your payment!</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-text">Authorized Signature</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleNewPayment = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setShowReceipt(false);
    setSuccess(false);
    setFormData({
      month: MONTHS[new Date().getMonth()],
      year: currentYear,
      amount: '',
      remarks: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getReceiptNumber = () => {
    return `REC-${Date.now().toString().slice(-8)}`;
  };

  // Show success message before receipt
  if (success && !showReceipt) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fee Collected Successfully!</h2>
          <p className="text-gray-500 mb-6">The payment has been recorded successfully.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowReceipt(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              View & Print Receipt
            </button>
            <button
              onClick={handleNewPayment}
              className="btn-secondary"
            >
              New Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showReceipt && success) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Print Receipt - Optimized for single page A5 landscape */}
        <div ref={receiptRef} className="receipt-container bg-white" style={{
          border: '2px solid #333',
          padding: '20px',
          maxWidth: '210mm',
          margin: '0 auto',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}>
          {/* Receipt Header */}
          <div className="text-center" style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
              JAWAHARLAL NEHRU NATIONAL YOUTH CENTRE
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 'bold', background: '#333', color: 'white', display: 'inline-block', padding: '3px 15px' }}>
              FEE PAYMENT RECEIPT
            </p>
          </div>

          {/* Receipt Info Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '8px', background: '#f5f5f5' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: '#555' }}>Receipt No: </span>
              <span>{getReceiptNumber()}</span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold', color: '#555' }}>Date: </span>
              <span>{new Date(formData.paymentDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Student Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', padding: '12px', background: '#fafafa', border: '1px solid #ddd' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Student Name</span>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedStudent?.name}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Course</span>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedStudent?.course}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Father&apos;s Name</span>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedStudent?.fatherName}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Contact</span>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedStudent?.contactNumber || 'N/A'}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ marginBottom: '15px', padding: '15px', background: '#f0fff4', border: '2px solid #48bb78' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Payment For</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{formData.month} {formData.year}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Amount Paid</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22543d' }}>{formatCurrency(formData.amount)}</div>
              </div>
            </div>
            {formData.remarks && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', fontSize: '11px' }}>
                <span style={{ fontWeight: 'bold', color: '#666' }}>Remarks: </span>
                {formData.remarks}
              </div>
            )}
          </div>

          {/* Signature */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#666' }}>This is a computer generated receipt.</p>
              <p style={{ fontSize: '10px', color: '#666' }}>Thank you for your payment!</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #333', width: '150px', paddingTop: '5px', marginBottom: '3px' }}></div>
              <span style={{ fontSize: '11px' }}>Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={handleNewPayment}
            className="btn-secondary"
          >
            New Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white p-8 mb-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold">Fee Collection</h1>
          <p className="mt-2 text-white/90">Collect fees from students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card bg-gradient-to-br from-white to-violet-50/20 border-0 shadow-xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            Payment Details
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, contact, or Aadhar..."
                className="input-field pl-10"
                disabled={!!selectedStudent}
              />
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary-600" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {students.length > 0 && !selectedStudent && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.course}</p>
                      </div>
                      <span className="text-sm text-gray-400">{student.contactNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="mt-2 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedStudent.photoPath ? (
                    <img 
                      src={selectedStudent.photoPath} 
                      alt={selectedStudent.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {selectedStudent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.course} • {selectedStudent.fatherName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                {MONTHS.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                placeholder="Enter amount"
                className="input-field pl-10"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select a past date to record back-dated fee collections.
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={2}
              className="input-field"
              placeholder="Optional notes about this payment"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-violet-50/30 to-purple-50/30">
          <button
            type="submit"
            disabled={!selectedStudent || !formData.amount || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IndianRupee className="h-4 w-4" />
                Collect Fee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeeCollection;
