import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Bell,
  User,
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const location = useLocation();

  const patientMenu = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/patient/appointments', label: 'Appointments', icon: Calendar },
    { path: '/patient/reports', label: 'Reports', icon: FileText },
    { path: '/patient/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/patient/notifications', label: 'Notifications', icon: Bell },
    { path: '/patient/profile', label: 'Profile', icon: User },
  ];

  const doctorMenu = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { path: '/doctor/reports', label: 'Reports', icon: FileText },
    { path: '/doctor/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/doctor/notifications', label: 'Notifications', icon: Bell },
    { path: '/doctor/profile', label: 'Profile', icon: User },
  ];

  const menu = role === 'patient' ? patientMenu : doctorMenu;

  return (
    <aside className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

