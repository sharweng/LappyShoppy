import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
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
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

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

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
                        className={`w-full h-full object-cover transition-all duration-300 ease-in-out ${imageTransition}`}
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
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
