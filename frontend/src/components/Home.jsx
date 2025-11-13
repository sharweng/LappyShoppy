import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Laptop, Shield, Zap, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:4001/api/v1';

const Home = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const observer = useRef();

  const lastProductRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchProducts = async (pageNum) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${API_URL}/products?page=${pageNum}`);
      
      if (data.products.length === 0) {
        setHasMore(false);
      } else {
        setProducts((prevProducts) => {
          const newProducts = data.products.filter(
            (newProduct) => !prevProducts.some((p) => p._id === newProduct._id)
          );
          return [...prevProducts, ...newProducts];
        });
        
        // Check if we've loaded all products
        const totalLoaded = products.length + data.products.length;
        if (totalLoaded >= data.productsCount) {
          setHasMore(false);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.message || 'Error loading products');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              LappyShoppy
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Your ultimate destination for premium laptops. Discover the latest models from top brands at unbeatable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-semibold transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Laptop className="w-5 h-5" />
              <span>Browse Products</span>
            </button>
            {!currentUser && (
              <Link
                to="/register"
                className="bg-white hover:bg-gray-50 text-blue-600 px-6 py-3 rounded-lg text-base font-semibold transition duration-300 shadow-lg hover:shadow-xl border-2 border-blue-600 flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Sign Up</span>
              </Link>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div id="products" className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Premium Laptops
          </h2>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : products.length === 0 && !loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Laptop className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No products available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for new arrivals!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => {
                  if (products.length === index + 1) {
                    return (
                      <div
                        ref={lastProductRef}
                        key={product._id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden"
                      >
                        <ProductCard product={product} />
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={product._id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden"
                      >
                        <ProductCard product={product} />
                      </div>
                    );
                  }
                })}
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <Loader2 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">Loading more products...</p>
                  <p className="text-sm text-gray-500 mt-1">Discovering amazing laptops for you</p>
                </div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-2">You've reached the end of our catalog!</p>
                  <p className="text-gray-500 text-sm">You've seen all {products.length} amazing laptops we have in store.</p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                  >
                    <span>Back to top</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const nameRef = useRef(null);

  const isTextTruncated = () => {
    if (nameRef.current) {
      return nameRef.current.scrollWidth > nameRef.current.clientWidth;
    }
    return false;
  };

  return (
    <>
      <div className="relative h-64 overflow-hidden bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Laptop className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Out of Stock
          </div>
        )}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Low Stock
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="relative mb-2">
          <h3 
            ref={nameRef}
            className="text-lg font-bold text-gray-900 truncate cursor-default"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {product.name}
          </h3>
          {showTooltip && isTextTruncated() && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl z-10 animate-fadeIn">
              {product.name}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-blue-600">
            ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {product.ratings > 0 && (
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm text-gray-600">
                {product.ratings.toFixed(1)} ({product.numOfReviews})
              </span>
            </div>
          )}
        </div>
        <button
          className={`w-full py-2 rounded-lg font-semibold transition duration-300 ${
            product.stock > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? 'View Details' : 'Out of Stock'}
        </button>
      </div>
    </>
  );
};

export default Home;
