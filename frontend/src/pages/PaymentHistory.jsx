import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Download, Trash2, Filter, X, Loader2, Printer, FileSpreadsheet } from 'lucide-react';
import { feeAPI, settingsAPI } from '../services/api';
import { exportPaymentsToCSV, printData } from '../utils/exportUtils';

const MONTHS = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COURSES = ['All', 'DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'];

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    month: 'All',
    year: new Date().getFullYear().toString(),
    course: 'All'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [settings, setSettings] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    fetchPayments();
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

  const fetchPayments = async (params = {}) => {
    try {
      setLoading(true);
      const response = await feeAPI.getAll(params);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = {};
    if (filters.month !== 'All') params.month = filters.month;
    if (filters.year !== 'All') params.year = filters.year;
    fetchPayments(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      month: 'All',
      year: new Date().getFullYear().toString(),
      course: 'All'
    });
    fetchPayments();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }
    try {
      await feeAPI.delete(id);
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrintReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  // Handle print - prints receipt in A5 landscape matching Fee Collection layout
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedPayment) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${selectedPayment.student?.name}</title>
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
              <span class="receipt-info-label">Receipt No:</span> ${getReceiptNumber(selectedPayment)}
            </div>
            <div>
              <span class="receipt-info-label">Date:</span> ${formatDate(selectedPayment.paymentDate)}
            </div>
          </div>

          <div class="student-info">
            <div>
              <div class="student-info-label">Student Name</div>
              <div class="student-info-value">${selectedPayment.student?.name || 'N/A'}</div>
            </div>
            <div>
              <div class="student-info-label">Course</div>
              <div class="student-info-value">${selectedPayment.student?.course || 'N/A'}</div>
            </div>
            <div>
              <div class="student-info-label">Father's Name</div>
              <div class="student-info-value">${selectedPayment.student?.fatherName || 'N/A'}</div>
            </div>
            <div>
              <div class="student-info-label">Contact Number</div>
              <div class="student-info-value">${selectedPayment.student?.contactNumber || 'N/A'}</div>
            </div>
          </div>

          <div class="payment-details">
            <div class="payment-row">
              <div>
                <div class="payment-for-label">Payment For</div>
                <div class="payment-for-value">${selectedPayment.month} ${selectedPayment.year}</div>
              </div>
              <div class="payment-amount">
                <div class="payment-amount-label">Amount Paid</div>
                <div class="payment-amount-value">${formatCurrency(selectedPayment.amount)}</div>
              </div>
            </div>
            ${selectedPayment.remarks ? `
            <div class="remarks">
              <span class="remarks-label">Remarks:</span> ${selectedPayment.remarks}
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

  const getReceiptNumber = (payment) => {
    return `REC-${payment.id.slice(-8).toUpperCase()}`;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !filters.search || 
      payment.student?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      payment.student?.fatherName?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCourse = filters.course === 'All' || payment.student?.course === filters.course;
    return matchesSearch && matchesCourse;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  // Export handlers
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert('No payments to export');
      return;
    }
    exportPaymentsToCSV(filteredPayments);
  };

  const handlePrintList = () => {
    if (filteredPayments.length === 0) {
      alert('No payments to print');
      return;
    }
    
    const headers = ['S.No.', 'Date', 'Student Name', "Father's Name", 'Course', 'Month/Year', 'Amount (₹)', 'Remarks'];
    const data = filteredPayments.map((payment, index) => [
      index + 1,
      payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '',
      payment.student?.name || '',
      payment.student?.fatherName || '',
      payment.student?.course || '',
      `${payment.month} ${payment.year}`,
      payment.amount || '',
      payment.remarks || ''
    ]);
    
    printData('Payment History', headers, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="mt-2 text-white/90">View and manage all fee payments</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={handlePrintList}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-6 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filter Options</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select name="month" value={filters.month} onChange={handleFilterChange} className="input-field">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} className="input-field">
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select name="course" value={filters.course} onChange={handleFilterChange} className="input-field">
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={applyFilters} className="btn-primary flex-1">Apply</button>
              <button onClick={clearFilters} className="btn-secondary">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Total Payments</p>
              <p className="text-3xl font-bold mt-1">{filteredPayments.length}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Printer className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Date Range</p>
              <p className="text-lg font-medium mt-1">
                {filters.month === 'All' ? 'All Months' : filters.month} {filters.year}
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Filter className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by student name..."
          className="input-field pl-10 w-full sm:w-96"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Course</th>
                  <th className="table-header">Month/Year</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header">Remarks</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(payment.paymentDate)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{payment.student?.name}</p>
                          <p className="text-sm text-gray-500">{payment.student?.fatherName}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 rounded-full text-xs font-medium">
                          {payment.student?.course}
                        </span>
                      </td>
                      <td className="table-cell">{payment.month} {payment.year}</td>
                      <td className="table-cell text-right">
                        <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-gray-500 text-sm truncate max-w-xs block">{payment.remarks || '-'}</span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <Printer className="h-4 w-4 text-white" />
                </div>
                Payment Receipt Preview
              </h3>
              <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div ref={receiptRef} className="p-8 bg-white">
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                {settings?.logoPath && (
                  <img src={settings.logoPath} alt="Logo" className="h-16 mx-auto mb-2 object-contain" />
                )}
                <h1 className="text-xl font-bold text-gray-900">{settings?.instituteName || 'JAWAHARLAL NEHRU NATIONAL YOUTH CENTRE'}</h1>
                {settings?.instituteAddress && (
                  <p className="text-sm text-gray-600">{settings.instituteAddress}</p>
                )}
                <p className="text-sm font-semibold text-gray-800 mt-1">FEE PAYMENT RECEIPT</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt No:</span>
                  <span className="font-semibold">{getReceiptNumber(selectedPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(selectedPayment.paymentDate)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 block text-sm">Student Name</span>
                      <span className="font-semibold">{selectedPayment.student?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Course</span>
                      <span className="font-semibold">{selectedPayment.student?.course}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Father&apos;s Name</span>
                      <span className="font-semibold">{selectedPayment.student?.fatherName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Contact</span>
                      <span className="font-semibold">{selectedPayment.student?.contactNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600 block text-sm">Payment For</span>
                      <span className="font-semibold">{selectedPayment.month} {selectedPayment.year}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-600 block text-sm">Amount Paid</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                  </div>
                  {selectedPayment.remarks && (
                    <div className="mt-4">
                      <span className="text-gray-600 block text-sm">Remarks</span>
                      <span>{selectedPayment.remarks}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-300">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500">This is a computer generated receipt.</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 w-32">
                      <span className="text-sm">Authorized Signature</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-gradient-to-r from-gray-50 to-gray-100">
              <button onClick={() => setShowReceipt(false)} className="btn-secondary">Close</button>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt (A5 Landscape)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
