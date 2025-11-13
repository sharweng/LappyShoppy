import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Laptop, Home, LogOut, ShoppingCart, Package } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartCount();

  // Treat user as not logged in on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const displayUser = isAuthPage ? null : currentUser;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Laptop className="w-8 h-8 text-white" />
            <span className="text-white text-2xl font-bold">LappyShoppy</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-white hover:text-blue-200 transition duration-300 font-medium flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {displayUser && (
              <>
                <Link
                  to="/orders"
                  className="text-white hover:text-blue-200 transition duration-300 font-medium flex items-center space-x-1"
                >
                  <Package className="w-4 h-4" />
                  <span>Orders</span>
                </Link>

                <Link
                  to="/cart"
                  className="text-white hover:text-blue-200 transition duration-300 font-medium flex items-center space-x-1 relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {displayUser ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-white hover:text-blue-200 transition duration-300"
                >
                  {displayUser.photoURL ? (
                    <img 
                      src={displayUser.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white">
                      {displayUser.displayName?.charAt(0).toUpperCase() || displayUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {displayUser.displayName?.split(' ')[0] || displayUser.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300 font-medium flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-blue-200 transition duration-300 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition duration-300 font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
