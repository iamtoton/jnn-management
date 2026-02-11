// Export utility functions for Students, Payments, and Due Lists

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of {key, label} objects for column mapping
 * @returns {string} CSV content
 */
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  // Create header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key];
      // Handle null/undefined
      if (value === null || value === undefined) return '""';
      // Handle strings with commas or quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export students data to CSV
 * @param {Array} students - Array of student objects
 */
export const exportStudentsToCSV = (students) => {
  const headers = [
    { key: 'name', label: 'Student Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'course', label: 'Course' },
    { key: 'contactNumber', label: 'Contact Number' },
    { key: 'aadharNumber', label: 'Aadhar Number' },
    { key: 'address', label: 'Address' },
    { key: 'admissionDate', label: 'Admission Date' },
    { key: 'isActive', label: 'Status' },
    { key: 'totalFeesPaid', label: 'Total Fees Paid' }
  ];
  
  // Format data
  const formattedData = students.map(student => ({
    ...student,
    admissionDate: student.admissionDate 
      ? new Date(student.admissionDate).toLocaleDateString('en-IN')
      : '',
    isActive: student.isActive ? 'Active' : 'Inactive',
    totalFeesPaid: student.feePayments 
      ? student.feePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)
      : '0.00'
  }));
  
  const csv = convertToCSV(formattedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Students_${timestamp}.csv`);
};

/**
 * Export payment history to CSV
 * @param {Array} payments - Array of payment objects
 */
export const exportPaymentsToCSV = (payments) => {
  const headers = [
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'course', label: 'Course' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'amount', label: 'Amount (₹)' },
    { key: 'remarks', label: 'Remarks' }
  ];
  
  // Format data
  const formattedData = payments.map(payment => ({
    paymentDate: payment.paymentDate 
      ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
      : '',
    studentName: payment.student?.name || '',
    fatherName: payment.student?.fatherName || '',
    course: payment.student?.course || '',
    month: payment.month || '',
    year: payment.year || '',
    amount: payment.amount || '',
    remarks: payment.remarks || ''
  }));
  
  const csv = convertToCSV(formattedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `PaymentHistory_${timestamp}.csv`);
};

/**
 * Export due list to CSV
 * @param {Array} dueStudents - Array of due student objects
 * @param {string} month - Month for the due list
 * @param {string} year - Year for the due list
 * @param {Array} payments - All payments for calculating previous dues
 */
export const exportDueListToCSV = (dueStudents, month, year, payments = []) => {
  const headers = [
    { key: 'name', label: 'Student Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'course', label: 'Course' },
    { key: 'contactNumber', label: 'Contact Number' },
    { key: 'admissionDate', label: 'Admission Date' },
    { key: 'currentDue', label: `Due for ${month} ${year} (₹)` },
    { key: 'previousDues', label: 'Previous Dues (₹)' },
    { key: 'totalDue', label: 'Total Due (₹)' }
  ];
  
  // Calculate previous dues helper
  const getPreviousDues = (studentId) => {
    const MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthIndex = MONTHS.indexOf(month);
    const currentYear = parseInt(year);
    
    let dueAmount = 0;
    for (let i = 1; i <= 6; i++) {
      let checkMonthIndex = currentMonthIndex - i;
      let checkYear = currentYear;
      
      if (checkMonthIndex < 0) {
        checkMonthIndex += 12;
        checkYear -= 1;
      }
      
      const checkMonth = MONTHS[checkMonthIndex];
      const hasPaid = payments.some(p => 
        p.studentId === studentId && 
        p.month === checkMonth && 
        p.year === checkYear
      );
      
      if (!hasPaid) {
        dueAmount += 500;
      }
    }
    return dueAmount;
  };
  
  // Format data
  const formattedData = dueStudents.map(student => {
    const prevDues = getPreviousDues(student.id);
    return {
      name: student.name || '',
      fatherName: student.fatherName || '',
      course: student.course || '',
      contactNumber: student.contactNumber || '',
      admissionDate: student.admissionDate 
        ? new Date(student.admissionDate).toLocaleDateString('en-IN')
        : '',
      currentDue: '500',
      previousDues: prevDues.toString(),
      totalDue: (500 + prevDues).toString()
    };
  });
  
  const csv = convertToCSV(formattedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `DueList_${month}_${year}_${timestamp}.csv`);
};

/**
 * Print data as a formatted table
 * @param {string} title - Title of the document
 * @param {Array} headers - Array of column headers
 * @param {Array} data - Array of data rows
 */
export const printData = (title, headers, data) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 20px;
          font-size: 12px;
        }
        h1 { 
          text-align: center; 
          margin-bottom: 20px;
          font-size: 18px;
          color: #333;
        }
        .date { 
          text-align: right; 
          margin-bottom: 20px;
          color: #666;
          font-size: 11px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        th { 
          background: #f3f4f6;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #d1d5db;
          font-size: 11px;
        }
        td { 
          padding: 8px; 
          border: 1px solid #d1d5db;
          font-size: 11px;
        }
        tr:nth-child(even) { background: #f9fafb; }
        .text-right { text-align: right; }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="date">Generated on: ${new Date().toLocaleString('en-IN')}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated by JNN Youth Centre Management System</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Print receipt in A5 landscape format
 * @param {Object} data - Receipt data
 * @param {Object} data.student - Student object
 * @param {string} data.month - Payment month
 * @param {string|number} data.year - Payment year
 * @param {number} data.amount - Payment amount
 * @param {string} data.remarks - Payment remarks
 * @param {string} data.paymentDate - Payment date
 * @param {Object} data.settings - Institute settings
 */
export const printReceipt = (data) => {
  const { student, month, year, amount, remarks, paymentDate, settings } = data;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amt);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN');
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const getReceiptNumber = () => {
    return `REC-${Date.now().toString().slice(-8).toUpperCase()}`;
  };

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Receipt - ${student?.name || 'Student'}</title>
      <style>
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          padding: 20px;
          font-size: 12px;
        }
        .receipt {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          border: 2px solid #333;
          padding: 20px;
          min-height: 130mm;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo {
          max-height: 50px;
          margin-bottom: 8px;
        }
        .institute-name {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .institute-address {
          font-size: 11px;
          color: #555;
          margin-bottom: 3px;
        }
        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
          padding: 5px 15px;
          background: #333;
          color: white;
          display: inline-block;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
        }
        .receipt-info-item {
          font-size: 12px;
        }
        .receipt-info-label {
          font-weight: bold;
          color: #555;
        }
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #fafafa;
          border: 1px solid #ddd;
        }
        .student-info-item {
          font-size: 12px;
        }
        .student-info-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .student-info-value {
          font-weight: bold;
          font-size: 13px;
        }
        .payment-details {
          margin-bottom: 20px;
          padding: 15px;
          background: #f0fff4;
          border: 2px solid #48bb78;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .payment-for {
          font-size: 12px;
        }
        .payment-for-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }
        .payment-for-value {
          font-weight: bold;
          font-size: 14px;
        }
        .payment-amount {
          text-align: right;
        }
        .payment-amount-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }
        .payment-amount-value {
          font-size: 24px;
          font-weight: bold;
          color: #22543d;
        }
        .remarks {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
          font-size: 11px;
        }
        .remarks-label {
          font-weight: bold;
          color: #666;
        }
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .note {
          font-size: 10px;
          color: #666;
        }
        .signature {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 150px;
          margin-bottom: 5px;
          padding-top: 5px;
        }
        .signature-text {
          font-size: 11px;
        }
        @media print {
          body {
            padding: 0;
          }
          .receipt {
            border: 2px solid #333;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          ${settings?.logoPath ? `<img src="${settings.logoPath}" alt="Logo" class="logo" />` : ''}
          <div class="institute-name">${settings?.instituteName || 'JAWAHARLAL NEHRU NATIONAL YOUTH CENTRE'}</div>
          ${settings?.instituteAddress ? `<div class="institute-address">${settings.instituteAddress}</div>` : ''}
          ${settings?.institutePhone ? `<div class="institute-address">Phone: ${settings.institutePhone}</div>` : ''}
          <div class="receipt-title">FEE PAYMENT RECEIPT</div>
        </div>

        <div class="receipt-info">
          <div class="receipt-info-item">
            <span class="receipt-info-label">Receipt No:</span> ${getReceiptNumber()}
          </div>
          <div class="receipt-info-item">
            <span class="receipt-info-label">Date:</span> ${formatDate(paymentDate)}
          </div>
        </div>

        <div class="student-info">
          <div class="student-info-item">
            <div class="student-info-label">Student Name</div>
            <div class="student-info-value">${student?.name || 'N/A'}</div>
          </div>
          <div class="student-info-item">
            <div class="student-info-label">Course</div>
            <div class="student-info-value">${student?.course || 'N/A'}</div>
          </div>
          <div class="student-info-item">
            <div class="student-info-label">Father's Name</div>
            <div class="student-info-value">${student?.fatherName || 'N/A'}</div>
          </div>
          <div class="student-info-item">
            <div class="student-info-label">Contact Number</div>
            <div class="student-info-value">${student?.contactNumber || 'N/A'}</div>
          </div>
        </div>

        <div class="payment-details">
          <div class="payment-row">
            <div class="payment-for">
              <div class="payment-for-label">Payment For</div>
              <div class="payment-for-value">${month || ''} ${year || ''}</div>
            </div>
            <div class="payment-amount">
              <div class="payment-amount-label">Amount Paid</div>
              <div class="payment-amount-value">${formatCurrency(amount)}</div>
            </div>
          </div>
          ${remarks ? `
          <div class="remarks">
            <span class="remarks-label">Remarks:</span> ${remarks}
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

export default {
  convertToCSV,
  downloadCSV,
  exportStudentsToCSV,
  exportPaymentsToCSV,
  exportDueListToCSV,
  printData,
  printReceipt
};
