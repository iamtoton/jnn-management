import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Search, 
  Filter, 
  IndianRupee, 
  Loader2, 
  X,
  UserCheck,
  Calendar,
  GraduationCap,
  Phone,
  Mail,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { studentAPI, feeAPI } from '../services/api';
import { exportDueListToCSV, printData } from '../utils/exportUtils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COURSES = ['All', 'DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'];

const DueList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    course: 'All',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString()
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, paymentsRes] = await Promise.all([
        studentAPI.getAll({ isActive: true }),
        feeAPI.getAll()
      ]);
      setStudents(studentsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a month/year is before admission date
  const isBeforeAdmissionDate = (admissionDateStr, month, year) => {
    if (!admissionDateStr) return false;
    
    const admissionDate = new Date(admissionDateStr);
    const monthIndex = MONTHS.indexOf(month);
    
    // Create date for the first day of the selected month/year
    const selectedDate = new Date(year, monthIndex, 1);
    
    // Get the first day of admission month
    const admissionMonthStart = new Date(
      admissionDate.getFullYear(),
      admissionDate.getMonth(),
      1
    );
    
    // The selected month is before admission if it's earlier than the admission month
    return selectedDate < admissionMonthStart;
  };

  // Calculate dues based on selected month/year
  const getDueStudents = () => {
    const selectedMonth = filters.month;
    const selectedYear = parseInt(filters.year);

    return students.filter(student => {
      // First check: Student should have been admitted before or during the selected month/year
      if (isBeforeAdmissionDate(student.admissionDate, selectedMonth, selectedYear)) {
        return false;
      }
      
      // Second check: Student has not paid for selected month/year
      const hasPaid = payments.some(p => 
        p.studentId === student.id && 
        p.month === selectedMonth && 
        p.year === selectedYear
      );
      
      return !hasPaid;
    });
  };

  const dueStudents = getDueStudents();

  // Filter by search and course
  const filteredDueStudents = dueStudents.filter(student => {
    const matchesSearch = !filters.search || 
      student.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.fatherName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.contactNumber?.includes(filters.search);
    
    const matchesCourse = filters.course === 'All' || student.course === filters.course;
    
    return matchesSearch && matchesCourse;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      course: 'All',
      month: MONTHS[new Date().getMonth()],
      year: new Date().getFullYear().toString()
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredDueStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredDueStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(sid => sid !== id));
    } else {
      setSelectedStudents(prev => [...prev, id]);
    }
  };

  const handleCollectFee = (student) => {
    navigate('/fees', { state: { student, month: filters.month, year: filters.year } });
  };

  const sendBulkReminders = () => {
    // In a real app, this would send SMS/emails
    alert(`Reminders would be sent to ${selectedStudents.length} students`);
  };

  // Export handlers
  const handleExportCSV = () => {
    if (filteredDueStudents.length === 0) {
      alert('No due students to export');
      return;
    }
    exportDueListToCSV(filteredDueStudents, filters.month, filters.year, payments);
  };

  const handlePrintList = () => {
    if (filteredDueStudents.length === 0) {
      alert('No due students to print');
      return;
    }
    
    const headers = ['S.No.', 'Student Name', "Father's Name", 'Course', 'Contact', 'Admission Date', 'Previous Dues (₹)', `Due for ${filters.month} ${filters.year} (₹)`];
    const data = filteredDueStudents.map((student, index) => {
      const prevDues = getPreviousDues(student.id);
      return [
        index + 1,
        student.name || '',
        student.fatherName || '',
        student.course || '',
        student.contactNumber || '',
        student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '',
        prevDues.amount.toString(),
        '500'
      ];
    });
    
    printData(`Fee Due List - ${filters.month} ${filters.year}`, headers, data);
  };

  // Calculate previous dues for a student
  const getPreviousDues = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { count: 0, amount: 0 };
    
    const currentMonthIndex = MONTHS.indexOf(filters.month);
    const currentYear = parseInt(filters.year);
    
    let dueCount = 0;
    let dueAmount = 0;
    
    // Check last 6 months
    for (let i = 1; i <= 6; i++) {
      let checkMonthIndex = currentMonthIndex - i;
      let checkYear = currentYear;
      
      if (checkMonthIndex < 0) {
        checkMonthIndex += 12;
        checkYear -= 1;
      }
      
      // Skip if this month is before student's admission
      if (isBeforeAdmissionDate(student.admissionDate, MONTHS[checkMonthIndex], checkYear)) {
        continue;
      }
      
      const checkMonth = MONTHS[checkMonthIndex];
      const hasPaid = payments.some(p => 
        p.studentId === studentId && 
        p.month === checkMonth && 
        p.year === checkYear
      );
      
      if (!hasPaid) {
        dueCount++;
        dueAmount += 500; // Assuming default fee of 500
      }
    }
    
    return { count: dueCount, amount: dueAmount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 text-white p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fee Due List</h1>
            <p className="mt-2 text-white/90">Track and collect pending monthly fees</p>
          </div>
          <div className="flex items-center gap-3">
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
      <div className="card p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="input-field bg-white"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="input-field bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              className="input-field bg-white"
            >
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search students..."
                className="input-field pl-10 w-full bg-white"
              />
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="btn-secondary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-rose-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">Total Due Students</p>
              <p className="text-3xl font-bold mt-1">{filteredDueStudents.length}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-400 to-amber-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Estimated Due Amount</p>
              <p className="text-3xl font-bold mt-1">₹{filteredDueStudents.length * 500}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{students.length}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Collection Rate</p>
              <p className="text-3xl font-bold mt-1">
                {students.length > 0 ? Math.round(((students.length - dueStudents.length) / students.length) * 100) : 0}%
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 flex items-center justify-between">
          <span className="font-medium text-primary-800">
            {selectedStudents.length} students selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStudents([])}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear Selection
            </button>
            <button
              onClick={sendBulkReminders}
              className="btn-primary flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Reminders
            </button>
          </div>
        </div>
      )}

      {/* Due List Table */}
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
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredDueStudents.length && filteredDueStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Course</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Admission Date</th>
                  <th className="table-header">Previous Dues</th>
                  <th className="table-header text-right">Current Due</th>
                  <th className="table-header text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDueStudents.length > 0 ? (
                  filteredDueStudents.map((student) => {
                    const previousDues = getPreviousDues(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            {student.photoPath ? (
                              <img 
                                src={student.photoPath} 
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {student.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.fatherName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="px-2 py-1 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 rounded-full text-xs font-medium">
                            {student.course}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            {student.contactNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(student.admissionDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="table-cell">
                          {previousDues.count > 0 ? (
                            <div className="text-sm">
                              <span className="text-red-600 font-semibold">{previousDues.count} months</span>
                              <span className="text-gray-500 ml-1">(₹{previousDues.amount})</span>
                            </div>
                          ) : (
                            <span className="text-green-600 text-sm">No pending dues</span>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          <span className="font-semibold text-rose-600">₹500</span>
                        </td>
                        <td className="table-cell text-center">
                          <button
                            onClick={() => handleCollectFee(student)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                          >
                            Collect Fee
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                        <UserCheck className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-gray-500 font-medium">No pending dues!</p>
                      <p className="text-sm text-gray-400 mt-1">All students have paid for {filters.month} {filters.year}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DueList;
