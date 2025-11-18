import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Laptop, 
  Star, 
  ShoppingCart, 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  Monitor, 
  Zap,
  Package,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

// Yup validation schema for review form
const reviewSchema = yup.object().shape({
  rating: yup.number()
    .required('Rating is required')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: yup.string()
    .max(500, 'Comment cannot exceed 500 characters'),
  isAnonymous: yup.boolean()
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageTransition, setImageTransition] = useState('');
  const [showSpecs, setShowSpecs] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [showImageModal, setShowImageModal] = useState(false);

  // React Hook Form for review
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset, watch } = useForm({
    resolver: yupResolver(reviewSchema),
    mode: 'onBlur',
    defaultValues: {
      rating: 5,
      comment: '',
      isAnonymous: false
    }
  });

  // Watch rating to show star selection
  const currentRating = watch('rating');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && currentUser) {
      checkReviewEligibility();
      fetchReviews();
    } else if (product) {
      fetchReviewsPublic();
    }
  }, [product, currentUser]);

  // Helper to check if a review belongs to the current user
  const isCurrentUserReview = (review) => {
    if (!currentUser || !userReview) return false;
    return review._id === userReview._id;
  };

  // Helper to format anonymous name
  const formatAnonymousName = (name) => {
    if (!name || name.length === 0) return 'Anonymous';
    if (name.length === 1) return name;
    const firstLetter = name.charAt(0);
    const lastLetter = name.charAt(name.length - 1);
    return `${firstLetter}*****${lastLetter}`;
  };

  // Helper to sort and filter reviews
  const getSortedAndFilteredReviews = () => {
    let sortedReviews = [...reviews];

    // Filter reviews
    if (reviewFilter === 'with-comments') {
      sortedReviews = sortedReviews.filter(review => review.comment && review.comment.trim().length > 0);
    }

    // Sort: User's review first, then by date (newest first)
    sortedReviews.sort((a, b) => {
      const aIsUserReview = isCurrentUserReview(a);
      const bIsUserReview = isCurrentUserReview(b);

      // User's review always comes first
      if (aIsUserReview && !bIsUserReview) return -1;
      if (!aIsUserReview && bIsUserReview) return 1;

      // Otherwise sort by date (newest first)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return sortedReviews;
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/product/${id}`);
      setProduct(data.product);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product');
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const token = await currentUser.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.get(`${API_URL}/review/can-review?productId=${id}`, config);
      setCanReview(data.canReview);
      setHasReview(data.hasReview);
      if (data.hasReview && data.review) {
        setUserReview(data.review);
        // Populate form with existing review
        reset({
          rating: data.review.rating,
          comment: data.review.comment || '',
          isAnonymous: data.review.isAnonymous || false
        });
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        const { data } = await axios.get(`${API_URL}/reviews?id=${id}`, config);
        setReviews(data.reviews);
      } else {
        const { data } = await axios.get(`${API_URL}/reviews?id=${id}`);
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }
  };

  const fetchReviewsPublic = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/reviews?id=${id}`);
      setReviews(data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }
  };

  const handleSubmitReview = async (formData) => {
    if (!currentUser) {
      toast.info('Please login to submit a review');
      navigate('/login');
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.put(`${API_URL}/review`, {
        rating: formData.rating,
        comment: formData.comment?.trim() || '',
        productId: id,
        isAnonymous: formData.isAnonymous
      }, config);

      toast.success(editingReview ? 'Review updated successfully' : 'Review submitted successfully');
      setShowReviewForm(false);
      setEditingReview(false);
      
      // Reset form
      reset({ rating: 5, comment: '', isAnonymous: false });
      
      // Refresh product and reviews
      await fetchProduct();
      await checkReviewEligibility();
      await fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const token = await currentUser.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.delete(`${API_URL}/reviews?id=${reviewToDelete}&productId=${id}`, config);
      toast.success('Review deleted successfully');
      
      // Reset review form
      reset({ rating: 5, comment: '', isAnonymous: false });
      setEditingReview(false);
      setShowReviewForm(false);
      setShowDeleteModal(false);
      setReviewToDelete(null);
      
      // Refresh product and reviews
      await fetchProduct();
      await checkReviewEligibility();
      await fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  const openDeleteModal = (reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };

  const handleEditReview = () => {
    // Populate form with existing review data
    reset({
      rating: userReview?.rating || 5,
      comment: userReview?.comment || '',
      isAnonymous: userReview?.isAnonymous || false
    });
    setEditingReview(true);
    setShowReviewForm(true);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      toast.info('Please login to purchase');
      navigate('/login');
      return;
    }

    // Add to cart and redirect to cart
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    navigate('/cart');
  };

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setImageTransition('opacity-0');
      setTimeout(() => {
        setSelectedImageIndex((prev) => 
          prev === product.images.length - 1 ? 0 : prev + 1
        );
        setTimeout(() => setImageTransition(''), 50);
      }, 200);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setImageTransition('opacity-0');
      setTimeout(() => {
        setSelectedImageIndex((prev) => 
          prev === 0 ? product.images.length - 1 : prev - 1
        );
        setTimeout(() => setImageTransition(''), 50);
      }, 200);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Product Images */}
            <div>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-3">
                {product.images && product.images.length > 0 ? (
                  <>
                    <div className="w-full h-80 overflow-hidden">
                      <img
                        src={product.images[selectedImageIndex].url}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-all duration-300 ease-in-out cursor-pointer ${imageTransition}`}
                        onClick={() => setShowImageModal(true)}
                      />
                    </div>
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition duration-300"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition duration-300"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-800" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === selectedImageIndex ? 'bg-blue-600 w-6' : 'bg-white/60 w-1.5'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-80 flex items-center justify-center">
                    <Laptop className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative bg-gray-100 rounded-lg overflow-hidden border-2 transition duration-300 ${
                        index === selectedImageIndex ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
                <p className="text-base text-gray-600">{product.brand}</p>
                
                {/* Rating */}
                {product.ratings > 0 && (
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratings)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {product.ratings.toFixed(1)} ({product.numOfReviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-blue-600">
                    ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  {product.stock > 0 ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-semibold text-sm">
                        In Stock ({product.stock} available)
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-semibold text-sm">Out of Stock</span>
                    </>
                  )}
                </div>
                {product.stock > 0 && product.stock <= 10 && (
                  <p className="text-orange-600 text-xs mt-1">Only {product.stock} left in stock!</p>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold transition duration-300"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-9 h-9 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold transition duration-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition duration-300 ${
                    product.stock > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition duration-300 flex items-center justify-center space-x-2 ${
                    product.stock > 0
                      ? 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>
              </div>

              {/* Description */}
              <div className="mb-4 pb-4 border-b">
                <h3 className="text-base font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Category */}
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {product.category}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="border-t bg-gray-50 p-6">
            <button
              onClick={() => setShowSpecs(!showSpecs)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
              {showSpecs ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>
            
            {showSpecs && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fadeIn">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <Cpu className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Processor</h3>
                      <p className="text-xs text-gray-700">{product.processor}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <HardDrive className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Memory & Storage</h3>
                      <p className="text-xs text-gray-700">{product.ram} RAM</p>
                      <p className="text-xs text-gray-700">{product.storage} Storage</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <Monitor className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Display</h3>
                      <p className="text-xs text-gray-700">{product.screenSize}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Graphics</h3>
                      <p className="text-xs text-gray-700">{product.graphics}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Operating System</h3>
                      <p className="text-xs text-gray-700">{product.operatingSystem}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 mb-0.5">Seller</h3>
                      <p className="text-xs text-gray-700">{product.seller}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="border-t bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <span>Customer Reviews</span>
              </h2>
              {currentUser && canReview && !hasReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-300"
                >
                  Write a Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {currentUser && showReviewForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">
                  {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                </h3>
                <form onSubmit={handleSubmit(handleSubmitReview)}>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setValue('rating', star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= currentRating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {errors.rating && (
                      <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Comment (Optional)</label>
                    <textarea
                      {...register('comment')}
                      rows="3"
                      className={`w-full px-3 py-2 text-sm border ${
                        errors.comment ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 ${
                        errors.comment ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                      } transition-colors`}
                      placeholder="Share your experience with this product..."
                    ></textarea>
                    {errors.comment && (
                      <p className="mt-1 text-xs text-red-600">{errors.comment.message}</p>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isAnonymous')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">Post as anonymous</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-lg font-semibold transition duration-300 disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Submitting...' : editingReview ? 'Update' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setEditingReview(false);
                        if (!hasReview) {
                          reset({ rating: 5, comment: '', isAnonymous: false });
                        }
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1.5 text-sm rounded-lg font-semibold transition duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Review eligibility message */}
            {currentUser && !canReview && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  You can only review products from delivered orders. Purchase this product and wait for delivery to leave a review.
                </p>
              </div>
            )}

            {/* Review Filters */}
            {reviews.length > 0 && (
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-300 ${
                    reviewFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({reviews.length})
                </button>
                <button
                  onClick={() => setReviewFilter('with-comments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-300 ${
                    reviewFilter === 'with-comments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  With Comments ({reviews.filter(r => r.comment && r.comment.trim().length > 0).length})
                </button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {getSortedAndFilteredReviews().map((review) => {
                  const isUserReview = isCurrentUserReview(review);
                  const displayName = review.isAnonymous ? formatAnonymousName(review.username) : review.username;
                  return (
                    <div 
                      key={review._id} 
                      className={`rounded-lg p-4 ${
                        isUserReview ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">{displayName}</h4>
                            {isUserReview && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                Your Review
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {isUserReview && (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleEditReview}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition duration-300"
                              title="Edit review"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(review._id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition duration-300"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Review</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setReviewToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && product.images && product.images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
            {/* Close Button - Top Right Corner */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons - Left/Right Edges */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition duration-300"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition duration-300"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Counter - Bottom Center */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {product.images.length}
              </div>
            )}

            {/* Main Image Container - Constrained for high-quality images */}
            <div className="relative max-w-5xl max-h-[calc(100vh-4rem)] bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img
                src={product.images[selectedImageIndex].url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
