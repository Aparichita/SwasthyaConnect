// src/pages/Predict.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI, appointmentAPI, gamificationAPI } from '../services/api';
import { toast } from 'react-toastify';

const Predict = () => {
  const { user, token, fetchGamificationPoints } = useAuth();
  const [formData, setFormData] = useState({
    Age: '',
    Weight: '',
    Height: '',
    Glucose: '',
    BP: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Call FastAPI backend through aiAPI
      const response = await aiAPI.predictDisease(formData, token);
      setResult(response.data);
      toast.success('Prediction successful!');

      // Award gamification points
      try {
        await gamificationAPI.awardPoints({ points: 10 });
        await gamificationAPI.logActivity({
          type: 'prediction',
          description: `Predicted disease: ${response.data.predicted_disease}`
        });
        fetchGamificationPoints();
      } catch (err) {
        console.error('Failed to update gamification points:', err);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail ||
        'Prediction failed. Make sure backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!result?.predicted_disease) return;

    const appointmentData = {
      patientId: user?._id || user?.id,
      patientName: user?.name,
      disease: result.predicted_disease,
      preferredDate: new Date().toISOString() // optionally allow user to pick date
    };

    try {
      const res = await appointmentAPI.book(appointmentData);
      if (res.data?.success) {
        toast.success('Appointment booked successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to book appointment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to book appointment.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Predict Disease</h2>

      <form onSubmit={handlePredict} className="space-y-4">
        {['Age', 'Weight', 'Height', 'Glucose', 'BP'].map((field) => (
          <div key={field}>
            <label className="block mb-1 font-medium">{field}</label>
            <input
              type="number"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full py-2 bg-primary-600 text-white font-semibold rounded hover:bg-primary-700"
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold text-lg mb-2">Prediction Result:</h3>
          <p><strong>Disease:</strong> {result.predicted_disease}</p>
          <p><strong>Risk Score:</strong> {result.risk_score}</p>
          <p><strong>Risk Category:</strong> {result.risk_category}</p>
          <button
            onClick={handleBookAppointment}
            className="mt-3 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Book Appointment
          </button>
        </div>
      )}
    </div>
  );
};

export default Predict;
