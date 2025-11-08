import React, { useState } from 'react';
import { predictionAPI } from '../services/api';
import { toast } from 'react-toastify';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    Age: '',
    Weight: '',
    Height: '',
    Glucose: '',
    BP: '',
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setPrediction(null);

      const data = {
        Age: Number(formData.Age),
        Weight: Number(formData.Weight),
        Height: Number(formData.Height),
        Glucose: Number(formData.Glucose),
        BP: Number(formData.BP),
      };

      const response = await predictionAPI.predictDisease(data);
      console.log('Prediction Result:', response.data);
      setPrediction(response.data);
      toast.success('Prediction fetched successfully!');
    } catch (err) {
      console.error('Prediction error:', err);
      if (err.response) {
        toast.error(`Backend Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        toast.error('Network Error: Cannot reach prediction server');
      } else {
        toast.error('Error fetching prediction');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-center">Health Risk Prediction</h2>

      <div className="space-y-2">
        {Object.keys(formData).map((key) => (
          <input
            key={key}
            type="number"
            name={key}
            value={formData[key]}
            onChange={handleChange}
            placeholder={`Enter ${key}`}
            className="w-full border rounded p-2"
          />
        ))}
      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded mt-3"
      >
        {loading ? 'Predicting...' : 'Predict'}
      </button>

      {prediction && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Prediction Result</h3>
          <p><strong>Disease:</strong> {prediction.predicted_disease}</p>
          <p><strong>Risk Score:</strong> {prediction.risk_score}</p>
          <p><strong>Risk Category:</strong> {prediction.risk_category}</p>
          <p><strong>Recommendations:</strong></p>
          <ul className="list-disc list-inside">
            {prediction.recommendations?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
