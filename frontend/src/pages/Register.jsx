import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Layout/Navbar';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    age: '',
    city: '',
    phone: '',
    specialization: '',
    // Doctor-specific fields
    qualification: '',
    medical_registration_number: '',
    state_medical_council: '',
    experience: '',
    clinic_name: '',
    consultation_type: 'Both',
    consultation_fee: '',
    declaration: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 8 || password.length > 32)
      return 'Password must be between 8 and 32 characters';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    if (!/[@$!%*?&#]/.test(password))
      return 'Password must contain at least one special character (@$!%*?&#)';
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    // Real-time password validation
    if (name === 'password') setPasswordError(validatePassword(value));
    if (name === 'confirmPassword')
      setPasswordError(value !== formData.password ? 'Passwords do not match' : '');
  };

  // frontend/src/pages/Register.jsx
// Replace the handleSubmit function with this:

const handleSubmit = async (e) => {
  e.preventDefault();

  // 🛑 HARD GUARD — prevents StrictMode double execution
  if (loading) return;

  // Password validation
  const pwdError = validatePassword(formData.password);
  if (pwdError) {
    setPasswordError(pwdError);
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setPasswordError('Passwords do not match');
    return;
  }

  // Doctor-specific validation
  if (formData.role === 'doctor') {
    if (
      !formData.medical_registration_number ||
      !formData.state_medical_council ||
      !formData.experience ||
      !formData.consultation_fee ||
      !formData.clinic_name ||
      !formData.city
    ) {
      setError('Please fill all required doctor fields');
      return;
    }
    if (!formData.declaration) {
      setError('Please accept the declaration to proceed');
      return;
    }
  }

  setLoading(true);
  setError('');
  setPasswordError('');

  const data = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
  };

  if (formData.role === 'patient') {
    if (formData.age) data.age = parseInt(formData.age);
    if (formData.city) data.city = formData.city;
    if (formData.phone) data.phone = formData.phone;
  } else {
    data.specialization = formData.specialization;
    data.qualification = formData.qualification;
    data.medical_registration_number = formData.medical_registration_number;
    data.state_medical_council = formData.state_medical_council;
    data.experience = parseInt(formData.experience);
    data.consultation_fee = parseFloat(formData.consultation_fee);
    data.consultation_type = formData.consultation_type;
    if (formData.city) data.city = formData.city;
    if (formData.phone) data.phone = formData.phone;
    if (formData.clinic_name) data.clinic_name = formData.clinic_name;
  }

  try {
    const result = await register(data, formData.role);

    if (result.success) {
      setSuccess(true);

      toast.success(
        '✅ Registration successful! Redirecting to login...',
        { autoClose: 3000 }
      );

      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Registration failed.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="max-w-2xl w-full bg-white rounded-squircle shadow-soft-lg p-8 border-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Register</h2>
            <p className="text-gray-600 mt-2">Create your SwasthyaConnect account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Name & Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                required
                minLength={8}
                maxLength={32}
                placeholder="8-32 chars, 1 letter, 1 number, 1 special char"
              />
              {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Must be 8-32 characters with at least one letter, one number, and one special
                character (@$!%*?&#)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Patient fields */}
            {formData.role === 'patient' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="9876543210"
                  />
                </div>
              </>
            )}

            {/* Doctor fields */}
            {formData.role === 'doctor' && (
              <>
                {/* Specialization, Qualification, Registration Number, State, Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Psychiatry">Psychiatry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="MBBS, MD, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="medical_registration_number"
                    value={formData.medical_registration_number}
                    onChange={handleChange}
                    placeholder="Enter registration number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State Medical Council <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state_medical_council"
                    value={formData.state_medical_council}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select state</option>
                    <option value="Maharashtra Medical Council">Maharashtra Medical Council</option>
                    <option value="Delhi Medical Council">Delhi Medical Council</option>
                    <option value="Karnataka Medical Council">Karnataka Medical Council</option>
                    <option value="Tamil Nadu Medical Council">Tamil Nadu Medical Council</option>
                    <option value="West Bengal Medical Council">West Bengal Medical Council</option>
                    <option value="Gujarat Medical Council">Gujarat Medical Council</option>
                    <option value="Rajasthan Medical Council">Rajasthan Medical Council</option>
                    <option value="Uttar Pradesh Medical Council">Uttar Pradesh Medical Council</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic / Hospital Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="clinic_name"
                    value={formData.clinic_name}
                    onChange={handleChange}
                    placeholder="Enter clinic or hospital name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type <span className="text-red-500">*</span></label>
                  <select
                    name="consultation_type"
                    value={formData.consultation_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="consultation_fee"
                    value={formData.consultation_fee}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="declaration"
                    checked={formData.declaration}
                    onChange={handleChange}
                    className="mt-1 mr-2"
                    required
                  />
                  <label className="text-sm text-gray-700">
                    I declare that the information provided is correct. <span className="text-red-500">*</span>
                  </label>
                </div>
              </>
            )}

            {/* Error & Success messages */}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><p>{error}</p></div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"><p>✅ Registration Successful! Redirecting to login...</p></div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-soft hover:shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
