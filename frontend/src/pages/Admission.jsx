import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Upload, 
  X, 
  Camera,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { studentAPI } from '../services/api';

const COURSES = ['DOA', 'DCA', 'DCAC', 'DDTP', 'ADCA'];

const Admission = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    aadharNumber: '',
    address: '',
    contactNumber: '',
    course: '',
    admissionDate: new Date().toISOString().split('T')[0],
    photo: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Photo size must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, photo: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const clearPhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = "Father's Name is required";
    }
    if (!formData.course) {
      newErrors.course = 'Course is required';
    }
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    }
    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await studentAPI.create(formData);
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          fatherName: '',
          aadharNumber: '',
          address: '',
          contactNumber: '',
          course: '',
          admissionDate: new Date().toISOString().split('T')[0],
          photo: null
        });
        setPhotoPreview(null);
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating student:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error.response?.data?.error || 'Failed to create student. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Admitted Successfully!</h2>
          <p className="text-gray-500">The student has been registered in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white p-8 mb-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold">New Admission</h1>
          <p className="mt-2 text-white/90">Register a new student for the course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card bg-gradient-to-br from-white to-emerald-50/20 border-0 shadow-xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            Student Information
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
            <div className="flex items-center gap-6">
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
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
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                {errors.photo && (
                  <p className="text-sm text-red-600 mt-1">{errors.photo}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className={`input-field ${errors.fatherName ? 'border-red-500' : ''}`}
                placeholder="Enter father's name"
              />
              {errors.fatherName && (
                <p className="text-sm text-red-600 mt-1">{errors.fatherName}</p>
              )}
            </div>

            {/* Aadhar Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                className={`input-field ${errors.aadharNumber ? 'border-red-500' : ''}`}
                placeholder="12 digit Aadhar number"
                maxLength={12}
              />
              {errors.aadharNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.aadharNumber}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className={`input-field ${errors.contactNumber ? 'border-red-500' : ''}`}
                placeholder="10 digit mobile number"
                maxLength={10}
              />
              {errors.contactNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.contactNumber}</p>
              )}
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className={`input-field ${errors.course ? 'border-red-500' : ''}`}
              >
                <option value="">Select Course</option>
                {COURSES.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              {errors.course && (
                <p className="text-sm text-red-600 mt-1">{errors.course}</p>
              )}
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Admission
              </label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Enter full address"
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-emerald-50/30 to-teal-50/30">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Admit Student
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Admission;
