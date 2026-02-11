import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Upload, 
  X, 
  CheckCircle, 
  Loader2, 
  Database, 
  Download, 
  RotateCcw, 
  Trash2, 
  Plus,
  AlertCircle,
  Archive
} from 'lucide-react';
import { settingsAPI, backupAPI } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    instituteName: '',
    instituteAddress: '',
    institutePhone: '',
    instituteEmail: '',
    receiptPrefix: 'JNN',
    logo: null
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      const data = response.data;
      setSettings(data);
      setFormData({
        instituteName: data.instituteName || '',
        instituteAddress: data.instituteAddress || '',
        institutePhone: data.institutePhone || '',
        instituteEmail: data.instituteEmail || '',
        receiptPrefix: data.receiptPrefix || 'JNN',
        logo: null
      });
      if (data.logoPath) {
        setLogoPreview(data.logoPath);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo size must be less than 2MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, logo: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await settingsAPI.update(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchSettings(); // Refresh settings
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 text-white p-8 mb-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-white/90">Manage institute details and preferences</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="p-1 bg-green-500 rounded-full">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-green-700 font-medium">Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            Institute Information
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institute Logo
            </label>
            <div className="flex items-center gap-6">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Logo</span>
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-sm text-gray-500 mt-2">Recommended: 200x200px, Max 2MB</p>
              </div>
            </div>
          </div>

          {/* Institute Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institute Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="instituteName"
              value={formData.instituteName}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="instituteAddress"
              value={formData.instituteAddress}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Enter institute address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="institutePhone"
                value={formData.institutePhone}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Contact number"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="instituteEmail"
                value={formData.instituteEmail}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Receipt Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Number Prefix
            </label>
            <input
              type="text"
              name="receiptPrefix"
              value={formData.receiptPrefix}
              onChange={handleInputChange}
              className="input-field w-32"
              placeholder="JNN"
            />
            <p className="text-sm text-gray-500 mt-1">
              This prefix will be used for receipt numbers (e.g., JNN-12345)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Data Backup Section */}
      <DataBackupSection />

      {/* System Info */}
      <div className="card mt-6 p-6 bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Version</span>
            <span className="text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Database</span>
            <span className="text-gray-900">SQLite</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Last Updated</span>
            <span className="text-gray-900">{new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Backup Component
const DataBackupSection = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await backupAPI.getAll();
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      await backupAPI.create();
      await fetchBackups();
      alert('Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await backupAPI.download(filename);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup.');
    }
  };

  const handleRestore = async (filename) => {
    try {
      setRestoring(true);
      await backupAPI.restore(filename);
      alert('Database restored successfully! The page will now reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup. Please try again.');
    } finally {
      setRestoring(false);
      setShowRestoreConfirm(null);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) {
      return;
    }
    try {
      await backupAPI.delete(filename);
      await fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Failed to delete backup.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card mt-6 p-6 bg-gradient-to-br from-white to-emerald-50/30 border-0 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          Data Backup & Restore
        </h3>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create Backup
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Create backups of your database to protect against data loss. You can download, restore, or delete backups at any time.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Archive className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No backups found</p>
          <p className="text-gray-400 text-xs mt-1">Create your first backup to protect your data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup, index) => (
            <div 
              key={backup.filename} 
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Database className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Backup #{backups.length - index}</p>
                  <p className="text-xs text-gray-500">{formatDate(backup.createdAt)} • {backup.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(backup.filename)}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(backup.filename)}
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(backup.filename)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="h-8 w-8" />
              <h3 className="text-lg font-semibold">Confirm Restore</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to restore the database from this backup? 
              <br /><br />
              <span className="text-amber-600 font-medium">
                Warning: All current data will be replaced with the backup data. 
                A backup of current data will be created automatically.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="btn-secondary"
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(showRestoreConfirm)}
                disabled={restoring}
                className="btn-primary bg-amber-600 hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50"
              >
                {restoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
