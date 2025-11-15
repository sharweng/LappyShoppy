import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { updateProfile } from 'firebase/auth';
import axios from 'axios';
import AdminLayout from '../Admin/AdminLayout';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Yup validation schemas
const profileSchema = yup.object().shape({
  displayName: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .matches(/^\S+$/, 'Username cannot contain spaces')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  email: yup
    .string()
    .email('Invalid email address')
});

const passwordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
});

const Profile = () => {
  const { currentUser, updateUserPassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      displayName: '',
      username: '',
      email: ''
    }
  });

  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (currentUser) {
      // Check if user is admin and fetch MongoDB user data
      const fetchUserData = async () => {
        try {
          const token = await currentUser.getIdToken();
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
          const { data } = await axios.get('http://localhost:4001/api/v1/me', config);
          setIsAdmin(data.user.role === 'admin');
          setUserData(data.user);
          
          // Check if user is OAuth user by checking Firebase provider data
          const providers = currentUser.providerData || [];
          const isOAuth = providers.some(provider => 
            provider.providerId === 'google.com' || 
            provider.providerId === 'facebook.com'
          );
          setIsOAuthUser(isOAuth);
          
          // Set profile form values
          profileForm.reset({
            displayName: currentUser.displayName || '',
            username: data.user.username || '',
            email: currentUser.email || ''
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to Firebase data only
          profileForm.reset({
            displayName: currentUser.displayName || '',
            username: '',
            email: currentUser.email || ''
          });
        }
      };

      fetchUserData();
    }
  }, [currentUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Cloudinary via backend endpoint (no auth required)
  const uploadToCloudinary = async (base64Image) => {
    try {
      const response = await axios.post(
        'http://localhost:4001/api/v1/upload/avatar',
        { image: base64Image },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );
      
      if (response.data.success) {
        return response.data.url;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection and try again with a smaller image.');
      }
      
      if (error.response?.data?.error === 'TIMEOUT') {
        throw new Error('Upload timeout. Your connection may be slow. Try with a smaller image.');
      }
      
      throw error;
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      const photoURL = currentUser.photoURL || userData?.avatar?.url || '';
      let newPhotoURL = photoURL;

      // Upload new image if selected
      if (selectedImage) {
        toast.info('Uploading image... This may take a moment on slow connections.');
        newPhotoURL = await uploadToCloudinary(selectedImage);
      }

      // Update Firebase profile with display name and photo URL
      await updateProfile(currentUser, {
        displayName: data.displayName,
        photoURL: newPhotoURL
      });

      // Update MongoDB profile (including username)
      const token = await currentUser.getIdToken();
      const updateData = {
        name: data.displayName,
        username: data.username
      };
      
      // Only include avatar if it's a new base64 image upload
      if (selectedImage && newPhotoURL.startsWith('http')) {
        updateData.avatar = newPhotoURL;
      }

      const response = await axios.put(
        'http://localhost:4001/api/v1/me/update',
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setUserData(response.data.user);
        profileForm.reset({
          displayName: data.displayName,
          username: response.data.user.username,
          email: data.email
        });
        setSelectedImage(null);
        setPreviewImage(null);
        
        // Force reload the page to update navbar
        window.location.reload();
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message?.includes('Username already taken') || 
          error.response?.data?.message?.includes('duplicate key error') && 
          error.response?.data?.message?.includes('username')) {
        profileForm.setError('username', {
          type: 'manual',
          message: 'Username already taken'
        });
        toast.error('Username already taken. Please choose another one.');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
        toast.error(errorMessage);
      }
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await updateUserPassword(data.newPassword);
      passwordForm.reset();
      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Password update error:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log in again to change your password');
      } else {
        toast.error('Failed to update password');
      }
    }
  };

  const profileContent = (
    <div className={isAdmin ? "p-4" : "min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8"}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {(currentUser?.photoURL || userData?.avatar?.url || previewImage) ? (
                  <img
                    src={previewImage || currentUser?.photoURL || userData?.avatar?.url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-400 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold">
                    {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {currentUser?.displayName || 'User Profile'}
                </h1>
                <p className="text-blue-100 mt-1">{currentUser?.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Information
              </button>
              {!isOAuthUser && (
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'password'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Change Password
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="flex gap-6">
                  {/* Left: Profile Photo */}
                  <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex flex-col items-center space-y-3">
                      <div>
                        {previewImage || currentUser?.photoURL || userData?.avatar?.url ? (
                          <img
                            src={previewImage || currentUser?.photoURL || userData?.avatar?.url}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-3xl font-bold">
                            {currentUser?.displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-block">
                          <span>Choose file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-2 text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Display Name, Username and Email */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Display Name
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        {...profileForm.register('displayName')}
                        className={`mt-1 block w-full px-3 py-2 border ${
                          profileForm.formState.errors.displayName 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                      />
                      {profileForm.formState.errors.displayName && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        {...profileForm.register('username')}
                        className={`mt-1 block w-full px-3 py-2 border ${
                          profileForm.formState.errors.username 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                        placeholder="johndoe123"
                      />
                      {profileForm.formState.errors.username && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                      {!profileForm.formState.errors.username && (
                        <p className="mt-1 text-xs text-gray-500">
                          3-20 characters, no spaces, letters, numbers and underscores only
                        </p>
                      )}
                    </div>

                    {!isOAuthUser && (
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          {...profileForm.register('email')}
                          disabled
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Email cannot be changed
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileForm.formState.isSubmitting ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    {...passwordForm.register('newPassword')}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      passwordForm.formState.errors.newPassword 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="Enter new password"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    {...passwordForm.register('confirmPassword')}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      passwordForm.formState.errors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="Confirm new password"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-yellow-700">
                      If you haven't logged in recently, you may need to log out and log in again before changing your password.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap with AdminLayout if user is admin, otherwise return content directly
  return isAdmin ? <AdminLayout>{profileContent}</AdminLayout> : profileContent;
};

export default Profile;
