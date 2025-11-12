import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated and has admin role
  // For now, we'll check if email is admin@lappyshoppy.com
  // Later you can add a custom claim or check against backend
  const isAdmin = currentUser && currentUser.email === 'admin@lappyshoppy.com';

  return isAdmin ? children : <Navigate to="/" />;
};

export default AdminRoute;
