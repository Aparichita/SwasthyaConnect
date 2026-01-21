import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { reportAPI, patientAPI, gamificationAPI, feedbackAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Trash2, Plus, Star } from 'lucide-react';
import { toast } from 'react-toastify';

const Reports = () => {
  const { user, isPatient, isDoctor } = useAuth();

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
    reportName: '',
    description: '',
    file: null,
  });
  const [feedbackData, setFeedbackData] = useState({
    doctorId: '',
    rating: 5,
    message: '',
  });

  // -------------------- Fetch initial data --------------------
  useEffect(() => {
    fetchData();
    if (isPatient) fetchDoctors();
  }, []);

  useEffect(() => {
    if (isDoctor && selectedPatient) fetchPatientReports(selectedPatient);
  }, [selectedPatient]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isPatient) {
        const res = await reportAPI.getMyReports();
        setReports(res.data?.data || []);
      } else if (isDoctor) {
        const patientsRes = await patientAPI.getAll();
        setPatients(patientsRes.data?.data || []);
        if (!selectedPatient && patientsRes.data?.data?.length) {
          setSelectedPatient(patientsRes.data.data[0]._id);
        }
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReports = async (patientId) => {
    setLoading(true);
    try {
      const res = await reportAPI.getByPatient(patientId);
      setReports(res.data?.data || []);
    } catch {
      toast.error('Failed to load patient reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await doctorAPI.getAll();
      setDoctors(res.data?.data || []);
    } catch {
      console.warn('Failed to fetch doctors for feedback');
    }
  };

  // -------------------- Handlers --------------------
  const handleFileChange = (e) => setFormData({ ...formData, file: e.target.files[0] });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.reportName || !formData.file) {
      toast.error('Please provide a report name and file');
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('reportName', formData.reportName);
      uploadData.append('description', formData.description);
      if (isDoctor && selectedPatient) uploadData.append('patient', selectedPatient);

      const res = await reportAPI.upload(uploadData); // ✅ FormData upload without manual Content-Type

      if (res.data?.success || res.data?.data) {
        toast.success('Report uploaded successfully!');
        setShowUploadModal(false);
        setFormData({ reportName: '', description: '', file: null });
        await fetchData();

        // Show feedback modal for patients after upload
        if (isPatient && doctors.length > 0) {
          setTimeout(() => setShowFeedbackModal(true), 800);
        }

        // Log activity for gamification
        if (isPatient) {
          try {
            await gamificationAPI.logActivity({
              activity: 'Uploaded Medical Report',
              description: `Report uploaded: ${formData.reportName}`,
            });
          } catch {}
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    try {
      const res = await feedbackAPI.add(feedbackData);
      if (res.data?.success || res.data?.data) {
        toast.success('Feedback submitted successfully!');
        setShowFeedbackModal(false);
        setFeedbackData({ doctorId: '', rating: 5, message: '' });

        if (isPatient) {
          try {
            await gamificationAPI.logActivity({
              activity: 'Submitted Feedback',
              description: `Feedback submitted with ${feedbackData.rating} star rating`,
            });
          } catch {}
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await reportAPI.delete(id);
      toast.success('Report deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const handleViewReport = async (report) => {
    try {
      toast.info('Opening report...');
      const response = await reportAPI.viewReport(report._id);

      if (!response.data || response.data.size === 0) throw new Error('Empty file received');

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<iframe src="${url}" frameborder="0" style="width:100%;height:100vh;margin:0;padding:0;"></iframe>`
        );
        newTab.document.title = report.reportName || 'Medical Report';
      } else {
        toast.error('Popup blocked. Please allow popups for this site.');
      }
    } catch (error) {
      console.error('View error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to view report';
      toast.error(errorMsg);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      toast.info('Downloading report...');
      const response = await reportAPI.downloadReport(report._id);

      if (!response.data || response.data.size === 0) throw new Error('Empty file received');

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.reportName || 'report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to download report';
      toast.error(errorMsg);
    }
  };

  // -------------------- Render --------------------
  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-gray-600 mt-2">{isPatient ? 'Manage your medical reports' : 'View patient medical reports'}</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span>{isDoctor ? 'Upload Prescription' : 'Upload Report'}</span>
          </button>
        </div>

        {/* Doctor: Select Patient */}
        {isDoctor && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a patient</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.name} - {p.email}</option>)}
            </select>
          </div>
        )}

        {/* Reports List */}
        {reports.length ? (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((r) => (
              <div key={r._id} className="bg-white rounded-lg shadow-md p-6 flex justify-between hover:shadow-lg transition">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{r.reportName || 'Medical Report'}</h3>
                      <p className="text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {r.description && <p className="text-gray-600 mb-2">{r.description}</p>}
                  <div className="flex space-x-3">
                    <button onClick={() => handleDownloadReport(r)} className="text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button onClick={() => handleViewReport(r)} className="text-blue-600 hover:text-blue-700">View</button>
                  </div>
                </div>
                {isPatient && (
                  <button onClick={() => handleDeleteReport(r._id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No reports found</p>
            <button onClick={() => setShowUploadModal(true)} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
              Upload Your First Report
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">{isDoctor ? 'Upload Prescription / Notes' : 'Upload Report'}</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                {isDoctor && (
                  <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required>
                    <option value="">Select a patient</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                )}
                <input type="text" placeholder="Report Name" value={formData.reportName} onChange={(e) => setFormData({ ...formData, reportName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                <input type="file" onChange={handleFileChange} className="w-full px-4 py-2 border rounded-lg" required />
                <div className="flex space-x-4">
                  <button type="submit" disabled={uploading} className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">Leave Feedback</h2>
                <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <select value={feedbackData.doctorId} onChange={(e) => setFeedbackData({ ...feedbackData, doctorId: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Select a doctor (optional)</option>
                  {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} - {d.specialization}</option>)}
                </select>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFeedbackData({ ...feedbackData, rating: star })} className={`p-2 ${feedbackData.rating >= star ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300'}`}>
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span>{feedbackData.rating} {feedbackData.rating === 1 ? 'star' : 'stars'}</span>
                </div>
                <textarea placeholder="Message (optional)" value={feedbackData.message} onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                <div className="flex space-x-4">
                  <button type="submit" disabled={!feedbackData.doctorId} className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">Submit Feedback</button>
                  <button type="button" onClick={() => setShowFeedbackModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Skip</button>
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
