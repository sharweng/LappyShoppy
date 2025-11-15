import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Laptop, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { login, signInWithGoogle, signInWithFacebook, logout } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email or username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      // If input is not an email, get the email from backend first
      let loginEmail = email;
      
      if (!email.includes('@')) {
        // It's a username, get the email from backend
        try {
          const axios = (await import('axios')).default;
          const response = await axios.post('http://localhost:4001/api/v1/get-user-email', {
            identifier: email
          });
          
          if (response.data.success) {
            loginEmail = response.data.email;
          } else {
            toast.error('Username not found');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error getting email:', error);
          toast.error('Username not found');
          setLoading(false);
          return;
        }
      }
      
      // Now login with email
      await login(loginEmail, password);
      toast.success('Login successful!');
      
      // Check if user is admin and redirect accordingly
      if (loginEmail === 'admin@lappyshoppy.com') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setErrors({ ...errors, email: 'No account found with this email' });
        toast.error('User not found');
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ ...errors, password: 'Incorrect password' });
        toast.error('Invalid password');
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ ...errors, email: 'Invalid email address' });
        toast.error('Invalid email address');
      } else if (error.code === 'auth/invalid-credential') {
        setErrors({ email: 'Invalid email/username or password', password: 'Invalid email/username or password' });
        toast.error('Invalid email/username or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
      // Check if user exists in backend
      try {
        const checkResponse = await fetch('http://localhost:4001/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (checkResponse.ok) {
          // User exists, proceed to home
          toast.success('Signed in with Google successfully!');
          navigate('/');
          return;
        }
      } catch (error) {
        // User doesn't exist, proceed with registration
      }
      
      // User doesn't exist, register them automatically
      try {
        const registrationData = {
          name: firebaseUser.displayName || 'Google User',
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RzwvdGV4dD48L3N2Zz4=`
        };
        
        // Add email if available
        if (firebaseUser.email) {
          registrationData.email = firebaseUser.email;
        }
        
        const axios = (await import('axios')).default;
        await axios.post('http://localhost:4001/api/v1/register', registrationData);
        toast.success('Account created and signed in successfully!');
        navigate('/');
      } catch (backendError) {
        console.error('Backend registration failed:', backendError);
        await logout(false);
        toast.error('Failed to complete sign in. Please try again.');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup, no need to show error
      } else {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading(true);
    try {
      const result = await signInWithFacebook();
      const firebaseUser = result.user;
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
      // Check if user exists in backend
      try {
        const checkResponse = await fetch('http://localhost:4001/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (checkResponse.ok) {
          // User exists, proceed to home
          toast.success('Signed in with Facebook successfully!');
          navigate('/');
          return;
        }
      } catch (error) {
        // User doesn't exist, proceed with registration
      }
      
      // User doesn't exist, register them automatically
      try {
        const registrationData = {
          name: firebaseUser.displayName || 'Facebook User',
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RjwvdGV4dD48L3N2Zz4=`
        };
        
        // Add email if available
        if (firebaseUser.email) {
          registrationData.email = firebaseUser.email;
        }
        
        const axios = (await import('axios')).default;
        await axios.post('http://localhost:4001/api/v1/register', registrationData);
        toast.success('Account created and signed in successfully!');
        navigate('/');
      } catch (backendError) {
        console.error('Backend registration failed:', backendError);
        await logout(false);
        toast.error('Failed to complete sign in. Please try again.');
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup, no need to show error
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with the same email address but different sign-in credentials.');
      } else {
        toast.error('Failed to sign in with Facebook. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div>
          <div className="flex justify-center">
            <Laptop className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to LappyShoppy
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email or Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="john@example.com or johndoe"
                  value={email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/password/forgot" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Social Login Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={socialLoading || loading}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Google
            </button>
            <button
              type="button"
              onClick={handleFacebookSignIn}
              disabled={socialLoading || loading}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            >
              <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
              Facebook
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
