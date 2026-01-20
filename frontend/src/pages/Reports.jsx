import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { reportAPI, patientAPI, gamificationAPI, feedbackAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, Download, Trash2, Plus, Star, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

const Reports = () => {
  const { user, isPatient, isDoctor } = useAuth();
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    reportName: '', // Changed from reportType to reportName to match backend
    description: '',
    file: null,
  });
  const [feedbackData, setFeedbackData] = useState({
    doctorId: '',
    rating: 5,
    message: '',
  });

  useEffect(() => {
    fetchData();
    // Fetch doctors for feedback (only for patients)
    if (isPatient) {
      fetchDoctors();
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await doctorAPI.getAll();
      setDoctors(res.data?.data || []);
    } catch (error) {
      console.warn('Failed to load doctors for feedback');
    }
  };

  const fetchData = async () => {
    try {
      if (isPatient) {
        // Patient: reportAPI.getMyReports() // GET /api/reports/my
        const res = await reportAPI.getMyReports();
        setReports(res.data?.data || []);
      } else if (isDoctor) {
        // Doctor: Get all patients to view their reports
        const patientsRes = await patientAPI.getAll();
        setPatients(patientsRes.data?.data || []);
        // Default to first patient if available and none selected
        if (!selectedPatient && patientsRes.data?.data?.length) {
          setSelectedPatient(patientsRes.data.data[0]._id);
        }
        // If a patient is selected, fetch their reports
        if (selectedPatient) {
          const reportsRes = await reportAPI.getByPatient(selectedPatient);
          setReports(reportsRes.data?.data || []);
        }
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports when patient is selected (for doctors)
  useEffect(() => {
    if (isDoctor && selectedPatient) {
      fetchPatientReports(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatientReports = async (patientId) => {
    try {
      // Doctor: reportAPI.getByPatient(patientId) // GET /api/reports/patient/:patientId
      const res = await reportAPI.getByPatient(patientId);
      setReports(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load patient reports');
    }
  };

  // Download report file
  const handleDownloadReport = async (reportId) => {
    try {
      toast.info('Downloading report...');
      const response = await reportAPI.downloadReport(reportId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download report');
    }
  };

  // View report in new tab
  const handleViewReport = async (reportId) => {
    try {
      toast.info('Opening report...');
      const response = await reportAPI.viewReport(reportId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create object URL and open in new tab
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast.success('Report opened in new tab!');
    } catch (error) {
      console.error('View error:', error);
      toast.error(error.response?.data?.message || 'Failed to view report');
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('reportName', formData.reportName); // Changed to reportName
      formDataToSend.append('description', formData.description);
      if (isDoctor && selectedPatient) {
        formDataToSend.append('patient', selectedPatient);
      }

      const response = await reportAPI.upload(formDataToSend);
      
      // Check if upload was successful
      if (response.data.success || response.data.data) {
        toast.success('Report uploaded successfully!');
        
        // Award gamification points for uploading report (only for patients)
        if (isPatient && user?._id) {
          try {
            await gamificationAPI.logActivity({
              activity: 'Uploaded Medical Report',
              description: `Report uploaded: ${formData.reportName}`,
            });
            console.log('✅ Gamification points awarded for uploading report');
          } catch (gamError) {
            console.warn('⚠️ Failed to award gamification points:', gamError);
            // Don't block the flow if gamification fails
          }
        }
        
        setShowModal(false);
        setFormData({ reportName: '', description: '', file: null });
        await fetchData();
        
        // Show feedback option for patients (optional)
        if (isPatient && doctors.length > 0) {
          // Small delay to show success message first
          setTimeout(() => {
            setShowFeedbackModal(true);
          }, 1000);
        }
      } else {
        throw new Error('Upload failed - invalid response');
      }
    } catch (error) {
      console.error('❌ Report upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload report');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    try {
      const response = await feedbackAPI.add(feedbackData);
      
      if (response.data.success || response.data.data) {
        toast.success('Feedback submitted successfully!');
        
        // Award gamification points for submitting feedback
        if (isPatient && user?._id) {
          try {
            await gamificationAPI.logActivity({
              activity: 'Submitted Feedback',
              description: `Feedback submitted with ${feedbackData.rating} star rating`,
            });
            console.log('✅ Gamification points awarded for submitting feedback');
          } catch (gamError) {
            console.warn('⚠️ Failed to award gamification points:', gamError);
          }
        }
        
        setShowFeedbackModal(false);
        setFeedbackData({ doctorId: '', rating: 5, message: '' });
      } else {
        throw new Error('Feedback submission failed');
      }
    } catch (error) {
      console.error('❌ Feedback submission error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to submit feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await reportAPI.delete(id);
      toast.success('Report deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await reportAPI.generatePDF();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'health-report.pdf';
      link.click();
      toast.success('PDF generated successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-2">
              {isPatient ? 'Manage your medical reports' : 'View patient medical reports'}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{isDoctor ? 'Upload Prescription' : 'Upload Report'}</span>
            </button>
          </div>
        </div>

        {/* Doctor: Patient Selection */}
        {isDoctor && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient to View Reports
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} - {patient.email}
                </option>
              ))}
            </select>
            {selectedPatient && reports.length === 0 && (
              <p className="text-gray-500 mt-4 text-center">No reports found for this patient</p>
            )}
          </div>
        )}

        {reports.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.reportName || report.reportType || 'Medical Report'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {report.description && (
                      <p className="text-gray-600 mb-4">{report.description}</p>
                    )}
                    {(report.fileUrl || report.file) && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleDownloadReport(report._id)}
                          className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 transition font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleViewReport(report._id)}
                          className="text-blue-600 hover:text-blue-700 text-sm transition font-medium"
                        >
                          View
                        </button>
                      </div>
                    )}
                  </div>
                  {isPatient && (
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No reports found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              Upload Your First Report
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isDoctor ? 'Upload Prescription / Add Consultation Notes' : 'Upload Report'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isDoctor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient
                    </label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reportName}
                    onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Blood Test Report, X-Ray Report"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Give your report a descriptive name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feedback Modal (shown after successful report upload) */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Leave Feedback</h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Your report was uploaded successfully! Would you like to leave feedback for a doctor? (Optional)
              </p>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor
                  </label>
                  <select
                    value={feedbackData.doctorId}
                    onChange={(e) => setFeedbackData({ ...feedbackData, doctorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a doctor (optional)</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFeedbackData({ ...feedbackData, rating })}
                        className={`p-2 rounded-lg transition-colors ${
                          feedbackData.rating >= rating
                            ? 'text-yellow-400 bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {feedbackData.rating} {feedbackData.rating === 1 ? 'star' : 'stars'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={feedbackData.message}
                    onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={!feedbackData.doctorId}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;

