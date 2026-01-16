import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { 
  Heart, Stethoscope, Calendar, FileText, Shield, CheckCircle, 
  MessageSquare, Brain, Award, Lock, UserCheck, Mail, 
  ArrowRight, Users, Clock, AlertTriangle
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section with Image */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20 animate-fade-in">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 animate-slide-up">
              Welcome to <span className="text-primary-600">SwasthyaConnect</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fade-in delay-100">
              Your Smart Healthcare Platform for Chronic Care Management
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-soft">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Verified Doctors</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-soft">
                <Shield className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Secure Medical Data</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-soft">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Appointment-Based Chat</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link
                to="/register"
                className="bg-primary-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-all shadow-soft hover:shadow-soft-lg"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-white text-primary-600 px-8 py-3 rounded-xl text-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-all shadow-soft"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="hidden md:block animate-fade-in delay-200">
            <img 
              src="/images/healthcare_image1.png" 
              alt="Doctor Patient Consultation"
              className="rounded-squircle shadow-soft-lg w-full h-auto"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Doctors</h3>
              <p className="text-gray-600">
                Connect with qualified, verified healthcare professionals
              </p>
            </div>

            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Appointment-Based Consultation</h3>
              <p className="text-gray-600">
                Book appointments with doctors who review and confirm your requests
              </p>
            </div>

            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Messaging</h3>
              <p className="text-gray-600">
                Communicate with doctors securely after appointment confirmation
              </p>
            </div>

            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Medical Report Management</h3>
              <p className="text-gray-600">
                Store and access your medical reports securely in one place
              </p>
            </div>

            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Health Assistance</h3>
              <p className="text-gray-600">
                Get AI-powered health insights and recommendations
              </p>
            </div>

            <div className="bg-white p-6 rounded-squircle shadow-soft border-0 hover:shadow-soft-lg transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gamification for Engagement</h3>
              <p className="text-gray-600">
                Earn points and rewards for maintaining your health
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20 bg-white rounded-squircle shadow-soft p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">1</div>
              <h3 className="text-lg font-semibold mb-2">Register & Verify Email</h3>
              <p className="text-gray-600 text-sm">
                Create your account and verify your email address to get started
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">2</div>
              <h3 className="text-lg font-semibold mb-2">Book Appointment</h3>
              <p className="text-gray-600 text-sm">
                Find a doctor and book an appointment with your preferred time slot
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">3</div>
              <h3 className="text-lg font-semibold mb-2">Doctor Confirms</h3>
              <p className="text-gray-600 text-sm">
                Doctor reviews and confirms your appointment request
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">4</div>
              <h3 className="text-lg font-semibold mb-2">Secure Chat Begins</h3>
              <p className="text-gray-600 text-sm">
                Once confirmed, start secure messaging with your doctor
              </p>
            </div>
          </div>
        </div>

        {/* Security & Compliance Section */}
        <div className="mb-20 bg-gradient-to-br from-primary-50 to-white rounded-squircle shadow-soft p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Security & Compliance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-soft">
              <Lock className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
              <p className="text-gray-600 text-sm">
                Strict access control ensures only authorized users can view data
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-soft">
              <Mail className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Verification</h3>
              <p className="text-gray-600 text-sm">
                All accounts require email verification for enhanced security
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-soft">
              <Shield className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
              <p className="text-gray-600 text-sm">
                Industry-standard encryption protects your login credentials
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-soft">
              <FileText className="w-10 h-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Data Protection</h3>
              <p className="text-gray-600 text-sm">
                Your medical data is encrypted and stored securely
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SwasthyaConnect</h3>
              <p className="text-gray-400 text-sm">
                Your trusted healthcare platform for managing chronic care and connecting with verified doctors.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Our Mission</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Team</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Important</h4>
              <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-100">
                    <strong>Non-Emergency Use Only:</strong> This platform is for non-emergency medical queries. 
                    In emergencies, contact local emergency services or visit the nearest hospital immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

