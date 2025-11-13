import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './components/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Profile from './components/User/Profile';
import Cart from './components/User/Cart';
import Checkout from './components/User/Checkout';
import MyOrders from './components/User/MyOrders';
import OrderDetail from './components/User/OrderDetail';
import Products from './components/Product/Products';
import ProductDetail from './components/Product/ProductDetail';
import Dashboard from './components/Admin/Dashboard';
import ProductList from './components/Admin/ProductList';
import ProductForm from './components/Admin/ProductForm';
import ProtectedRoute from './components/Route/ProtectedRoute';
import AdminRoute from './components/Route/AdminRoute';

function AppContent() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
          const { data } = await axios.get('http://localhost:4001/api/v1/me', config);
          setIsAdmin(data.user.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [currentUser]);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProfilePage = location.pathname === '/profile';
  const shouldHideNavbar = isAdminRoute || (isProfilePage && isAdmin);
  const shouldShowFooter = !isAdminRoute && !(isProfilePage && isAdmin);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!shouldHideNavbar && <Navbar />}
      <div className="flex-grow">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <ProductList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/product/new"
          element={
            <AdminRoute>
              <ProductForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/product/edit/:id"
          element={
            <AdminRoute>
              <ProductForm />
            </AdminRoute>
          }
        />
      </Routes>
      </div>
      {shouldShowFooter && <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
