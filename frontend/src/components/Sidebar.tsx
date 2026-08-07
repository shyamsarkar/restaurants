import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { 
  Home, 
  ShoppingCart, 
  TableRestaurant, 
  Kitchen as KitchenIcon, 
  MenuBook, 
  PeopleAlt, 
  BarChart, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Logout
} from '@mui/icons-material';

import ProfileDropdown from './ProfileDropdown';
import { useCommonStore } from '@/stores/common.store';

const basePath = '';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Billing POS', path: `${basePath}/orders` },
  { icon: TableRestaurant, label: 'Tables', path: `${basePath}/tables` },
  { icon: KitchenIcon, label: 'Kitchen View', path: `${basePath}/kitchen` },
  { icon: MenuBook, label: 'Menu Editor', path: `${basePath}/menu` },
  { icon: PeopleAlt, label: 'Customers', path: `${basePath}/customers` },
  { icon: BarChart, label: 'Reports', path: `${basePath}/reports` },
  { icon: SettingsIcon, label: 'Settings', path: `${basePath}/settings` },
];

const Sidebar: React.FC = () => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const showSidebar = useCommonStore((state) => state.showSidebar);
  const { toggleSidebar } = useCommonStore();
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/');
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-100 shadow-xl z-50 transition-all duration-300 ease-in-out ${
      showSidebar ? 'w-56' : 'w-16'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className={`flex items-center space-x-3 ${showSidebar ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ${showSidebar ? '' : 'hidden'}`}>
          <h1 onClick={handleNavigate} className="cursor-pointer text-lg font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent whitespace-nowrap">
            MealDesk
          </h1>
        </div>
        <button
          onClick={() => toggleSidebar(!showSidebar)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors duration-200"
        >
          {showSidebar ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-600/90 text-white font-medium shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`ml-3 text-sm font-medium whitespace-nowrap ${showSidebar ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-all duration-200`}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!showSidebar && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-100 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-800">
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className={`flex items-center w-full p-2 rounded-lg hover:bg-slate-800 transition-colors duration-200 ${
              showSidebar ? 'space-x-3' : 'justify-center'
            }`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">MD</span>
            </div>
            <div className={`flex-1 text-left truncate ${showSidebar ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-all duration-200`}>
              <div className="text-xs font-semibold text-slate-200">System Operator</div>
            </div>
          </button>

          {profileDropdownOpen && (
            <ProfileDropdown onClose={() => setProfileDropdownOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;