import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, UserPlus, Filter, X, Loader2, GraduationCap, UserCheck, Camera, Upload, Eye, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { studentAPI } from '../services/api';
import { exportStudentsToCSV, printData } from '../utils/exportUtils';

const COURSES = ['All', 'DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'];
const COURSE_OPTIONS = ['DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'];

const Students = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    course: 'All',
    isActive: 'true'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    fatherName: '',
    aadharNumber: '',
    address: '',
    contactNumber: '',
    course: '',
    isActive: true,
    photo: null
  });
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (params = {}) => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll(params);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
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
    if (filters.course !== 'All') params.course = filters.course;
    if (filters.isActive) params.isActive = filters.isActive === 'true';
    fetchStudents(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      course: 'All',
      isActive: 'true'
    });
    fetchStudents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    try {
      await studentAPI.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student. Please try again.');
    }
  };

  // View student details
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Edit student functions
  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name || '',
      fatherName: student.fatherName || '',
      aadharNumber: student.aadharNumber || '',
      address: student.address || '',
      contactNumber: student.contactNumber || '',
      course: student.course || '',
      isActive: student.isActive !== false,
      photo: null
    });
    setEditPhotoPreview(student.photoPath || null);
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setEditErrors(prev => ({ ...prev, photo: 'Photo size must be less than 5MB' }));
        return;
      }
      setEditFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setEditErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const clearEditPhoto = () => {
    setEditFormData(prev => ({ ...prev, photo: null }));
    setEditPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!editFormData.fatherName.trim()) {
      newErrors.fatherName = "Father's Name is required";
    }
    if (!editFormData.course) {
      newErrors.course = 'Course is required';
    }
    if (editFormData.aadharNumber && !/^\d{12}$/.test(editFormData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    }
    if (editFormData.contactNumber && !/^\d{10}$/.test(editFormData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setEditLoading(true);
      await studentAPI.update(editingStudent.id, editFormData);
      await fetchStudents();
      setShowEditModal(false);
      setEditingStudent(null);
      alert('Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      setEditErrors(prev => ({
        ...prev,
        submit: error.response?.data?.error || 'Failed to update student. Please try again.'
      }));
    } finally {
      setEditLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.fatherName?.toLowerCase().includes(searchLower) ||
      student.contactNumber?.includes(filters.search) ||
      student.aadharNumber?.includes(filters.search)
    );
  });

  // Export handlers
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('No students to export');
      return;
    }
    exportStudentsToCSV(filteredStudents);
  };

  const handlePrint = () => {
    if (filteredStudents.length === 0) {
      alert('No students to print');
      return;
    }
    
    const headers = ['S.No.', 'Student Name', "Father's Name", 'Course', 'Contact', 'Admission Date', 'Status'];
    const data = filteredStudents.map((student, index) => [
      index + 1,
      student.name || '',
      student.fatherName || '',
      student.course || '',
      student.contactNumber || '',
      student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '',
      student.isActive ? 'Active' : 'Inactive'
    ]);
    
    printData('Student List', headers, data);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="mt-2 text-white/90">Manage all registered students</p>
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
              onClick={() => navigate('/admission')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              New Admission
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Print List"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-6 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
              Filter Options
            </h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select name="course" value={filters.course} onChange={handleFilterChange} className="input-field">
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="isActive" value={filters.isActive} onChange={handleFilterChange} className="input-field">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{filteredStudents.length}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Active Students</p>
              <p className="text-3xl font-bold mt-1">{filteredStudents.filter(s => s.isActive).length}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm">Courses</p>
              <p className="text-3xl font-bold mt-1">{COURSES.length - 1}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
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
          placeholder="Search by name, contact, or Aadhar..."
          className="input-field pl-10 w-full sm:w-96"
        />
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="card hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/20 border-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {student.photoPath ? (
                        <img 
                          src={student.photoPath} 
                          alt={student.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="font-semibold text-gray-900 hover:text-primary-600 hover:underline text-left"
                        >
                          {student.name}
                        </button>
                        <p className="text-sm text-gray-500">{student.fatherName}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-blue-100 text-primary-800 mt-1">
                          {student.course}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(student)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Contact:</span>
                      <span className="text-gray-900">{student.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Aadhar:</span>
                      <span className="text-gray-900">{student.aadharNumber ? `XXXX${student.aadharNumber.slice(-4)}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Admission:</span>
                      <span className="text-gray-900">{formatDate(student.admissionDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {student.feePayments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Fees Paid:</span>
                        <span className="font-semibold text-green-600">
                          ₹{student.feePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No students found</p>
              <button
                onClick={() => navigate('/admission')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Add New Student
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                Student Details
              </h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {selectedStudent.photoPath ? (
                  <img 
                    src={selectedStudent.photoPath} 
                    alt={selectedStudent.name}
                    className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-500">{selectedStudent.fatherName}&apos;s child</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-primary-100 to-blue-100 text-primary-800 mt-2">
                    {selectedStudent.course}
                  </span>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedStudent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.isActive ? 'Active Student' : 'Inactive Student'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.contactNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Aadhar Number</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.aadharNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Admission Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedStudent.admissionDate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Student ID</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {selectedStudent.address && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.address}</p>
                </div>
              )}

              {selectedStudent.feePayments?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedStudent.feePayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{payment.month} {payment.year}</p>
                          <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                        </div>
                        <span className="font-semibold text-green-600">{parseFloat(payment.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Total Fees Paid</span>
                    <span className="font-bold text-green-600 text-lg">
                      ₹{selectedStudent.feePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowViewModal(false)} className="btn-secondary">Close</button>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedStudent);
                }} 
                className="btn-primary flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary-50 to-blue-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-blue-500 rounded-lg">
                  <Edit2 className="h-4 w-4 text-white" />
                </div>
                Edit Student
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              {/* Photo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
                <div className="flex items-center gap-6">
                  {editPhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={editPhotoPreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={clearEditPhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Add Photo</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {editPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                    {editErrors.photo && (
                      <p className="text-sm text-red-600 mt-1">{editErrors.photo}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={`input-field ${editErrors.name ? 'border-red-500' : ''}`}
                  />
                  {editErrors.name && <p className="text-sm text-red-600 mt-1">{editErrors.name}</p>}
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father&apos;s Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={editFormData.fatherName}
                    onChange={handleEditInputChange}
                    className={`input-field ${editErrors.fatherName ? 'border-red-500' : ''}`}
                  />
                  {editErrors.fatherName && <p className="text-sm text-red-600 mt-1">{editErrors.fatherName}</p>}
                </div>

                {/* Aadhar Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={editFormData.aadharNumber}
                    onChange={handleEditInputChange}
                    maxLength={12}
                    className={`input-field ${editErrors.aadharNumber ? 'border-red-500' : ''}`}
                  />
                  {editErrors.aadharNumber && <p className="text-sm text-red-600 mt-1">{editErrors.aadharNumber}</p>}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={editFormData.contactNumber}
                    onChange={handleEditInputChange}
                    maxLength={10}
                    className={`input-field ${editErrors.contactNumber ? 'border-red-500' : ''}`}
                  />
                  {editErrors.contactNumber && <p className="text-sm text-red-600 mt-1">{editErrors.contactNumber}</p>}
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="course"
                    value={editFormData.course}
                    onChange={handleEditInputChange}
                    className={`input-field ${editErrors.course ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Course</option>
                    {COURSE_OPTIONS.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                  {editErrors.course && <p className="text-sm text-red-600 mt-1">{editErrors.course}</p>}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editFormData.isActive}
                      onChange={handleEditInputChange}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Student</span>
                  </label>
                </div>
              </div>

              {/* Address */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="input-field"
                />
              </div>

              {editErrors.submit && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{editErrors.submit}</p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
