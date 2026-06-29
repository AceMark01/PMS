import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Settings,
  LogOut as LogOutIcon,
  X,
  Users,
  Database,
  ClipboardList,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle,
  ShoppingCart,
  FilePlus2,
  Search,
  Pencil,
  LayoutGrid,
  FilePlus,
  ClipboardCheck,
  Tags,
  Cpu,
  HelpCircle,
  TrendingUp,
  UserCheck,
  History,
  PackageSearch,
  Truck,
  Package,
  CreditCard,
  Ban,
  Warehouse,
  Coins,
  Receipt,
  Blocks
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const adminMenuItems = [
    { path: '/dashboard',           icon: TrendingUp,     label: 'Dashboard' },
    { path: '/inventory',           icon: Package,        label: 'Inventory' },
    { path: '/bom',                 icon: LayoutGrid,     label: 'BOM' },
    { path: '/indent',              icon: ShoppingCart,   label: 'Indent' },
    { path: '/production-orders',   icon: ClipboardList,  label: 'Order of Production' },
    { path: '/full-kitting',        icon: Blocks,         label: 'Full Kitting' },
    { path: '/actual-production',   icon: ClipboardCheck, label: 'Actual Production' },
    { path: '/testing',             icon: CheckCircle,    label: 'Testing' },
    { path: '/settings',            icon: Settings,       label: 'Settings' },
  ];

  const employeeMenuItems = [
    { path: '/inventory',         icon: Package,        label: 'Inventory' },
    { path: '/bom',               icon: LayoutGrid,     label: 'BOM' },
    { path: '/indent',            icon: ShoppingCart,   label: 'Indent' },
    { path: '/production-orders', icon: ClipboardList,  label: 'Order of Production' },
    { path: '/full-kitting',      icon: Blocks,         label: 'Full Kitting' },
    { path: '/actual-production',   icon: ClipboardCheck, label: 'Actual Production' },
    { path: '/testing',             icon: CheckCircle,    label: 'Testing' },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems : employeeMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 sm:w-72 lg:w-56 2xl:w-60 bg-white border-r border-indigo-100 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-indigo-600 tracking-tight">PMS</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-indigo-100/50 rounded-lg">
              <X size={20} className="text-indigo-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.isNested ? (
                  <div className="space-y-1">
                    <button
                      onClick={item.onToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-indigo-100/50 hover:text-indigo-600 border-l-4 border-transparent`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="font-medium leading-tight whitespace-nowrap">{item.label}</span>
                      </div>
                      {item.isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {item.isOpen && (
                      <div className="pl-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                              flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200
                              ${isActive 
                                ? 'bg-indigo-100/50 text-indigo-600' 
                                : 'text-gray-600 hover:bg-indigo-50/50 hover:text-indigo-600'}
                            `}
                          >
                            <span className="text-sm leading-tight whitespace-nowrap font-black">{sub.label}</span>
                            {sub.count > 0 && (
                              <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                {sub.count}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'bg-indigo-100/50 text-indigo-600 border-l-4 border-indigo-600' 
                        : 'text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-600 border-l-4 border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="font-black leading-tight whitespace-nowrap">{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-indigo-100 bg-indigo-50/50 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-inner uppercase flex-shrink-0">
                {user?.name ? user.name.charAt(0) : user?.id?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate uppercase">{user?.name || user?.id || 'User'}</p>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">{user?.role || 'USER'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all font-semibold shadow-sm"
            >
              <LogOutIcon size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;