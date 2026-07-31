import React, { useEffect, useState } from 'react';
import { Notifications, Settings, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCommonStore } from '@/stores/common.store';
import { logoutUser, getRestaurantInfo } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const showSidebar = useCommonStore((state) => state.showSidebar);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState<string>('Loading...');

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await getRestaurantInfo();
        setRestaurantName(info.name);
      } catch (err) {
        console.error('Failed to load restaurant info:', err);
        setRestaurantName('Restaurant POS');
      }
    };
    fetchInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    }
    catch {
      console.log("Unable to logout");
    }
    finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  const gotoSettings = () => {
    navigate('restaurants/settings');
  };

  const gotoNotification = () => {
    navigate('restaurants/notification');
  };

  const menuItems = [
    { icon: Notifications, label: 'Notifications', onClick: gotoNotification, badge: '3' },
    { icon: Settings, label: 'Settings', onClick: gotoSettings },
    { icon: Logout, label: 'Logout', danger: true, onClick: handleLogout },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className={`absolute bottom-full mb-2 ${showSidebar ? 'left-0' : 'left-full ml-2'} w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}>
        {/* Profile Header */}
        <div className="flex flex-col items-center px-1 py-3 border-b border-gray-100">
          <span className="text-lg font-medium text-gray-900 ml-1">{restaurantName}</span>
          <span className="text-xs text-gray-500 mt-1">{user?.email || 'user@example.com'}</span>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-200 ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                }`}
              onClick={item.onClick ?? onClose}
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;