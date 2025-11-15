import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Users,
  Package,
  ShoppingBag,
  Star,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  // Load sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: Home,
      active: true,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: Users,
      active: true,
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: Package,
      active: true,
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: ShoppingBag,
      active: true,
    },
    {
      name: 'Reviews',
      path: '/admin/reviews',
      icon: Star,
      active: true,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo and Toggle - styled to match nav items */}
        <div className={`border-b border-blue-700 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center px-2">
              <NavLink
                to="/admin/dashboard"
                className="flex items-center space-x-3 px-4 py-3 transition-all duration-200 hover:bg-blue-700/50"
              >
                <Package className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-lg">LappyShoppy</span>
              </NavLink>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto flex items-center justify-center px-4 py-3 transition-all duration-200 hover:bg-blue-700/50"
                aria-label="Minimize sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { navigate('/admin/dashboard'); setSidebarOpen(true); }}
                className="flex items-center justify-center h-12 w-full px-4 transition-all duration-200 hover:bg-blue-700/50"
                aria-label="Open dashboard"
                style={{ minHeight: 48 }}
              >
                <Package className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700 shadow-lg border-l-4 border-white'
                    : 'hover:bg-blue-700/50 border-l-4 border-transparent'
                } ${!item.active ? 'opacity-50 cursor-not-allowed' : ''}`
              }
              onClick={(e) => {
                if (!item.active) {
                  e.preventDefault();
                }
              }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between flex-1">
                  <span className="font-medium">{item.name}</span>
                  {!item.active && (
                    <span className="text-xs bg-blue-900 px-2 py-1 rounded">Soon</span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile/footer - match nav item styles */}
        <div className="border-t border-blue-700">
          {sidebarOpen ? (
            <div className="flex flex-col">
              <NavLink
                to="/profile"
                className="flex items-center space-x-3 px-4 py-3 transition-all duration-200 hover:bg-blue-700/50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {currentUser?.displayName?.charAt(0) || 'A'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">
                    {currentUser?.displayName || 'Admin'}
                  </p>
                  <p className="text-xs text-blue-200 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 transition-all duration-200 hover:bg-red-700 bg-red-600 text-white"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={() => { navigate('/profile'); }}
                className="flex items-center justify-center h-12 w-full px-4 py-3 min-h-[64px] transition-all duration-200 hover:bg-blue-700/50"
                aria-label="Go to profile"
              >
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {currentUser?.displayName?.charAt(0) || 'A'}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="mt-0 flex items-center justify-center h-12 w-full px-4 transition-all duration-200 hover:bg-red-700 bg-red-600 text-white"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white z-50 md:hidden transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b border-blue-700">
              <div className="flex items-center space-x-2">
                <Package className="w-8 h-8" />
                <span className="text-xl font-bold">LappyShoppy</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-blue-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive ? 'bg-blue-700 shadow-lg' : 'hover:bg-blue-700/50'
                    } ${!item.active ? 'opacity-50 cursor-not-allowed' : ''}`
                  }
                  onClick={(e) => {
                    if (!item.active) {
                      e.preventDefault();
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium">{item.name}</span>
                    {!item.active && (
                      <span className="text-xs bg-blue-900 px-2 py-1 rounded">Soon</span>
                    )}
                  </div>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-blue-700 p-4">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {currentUser?.displayName?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {currentUser?.displayName || 'Admin'}
                    </p>
                    <p className="text-xs text-blue-200 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">LappyShoppy</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
