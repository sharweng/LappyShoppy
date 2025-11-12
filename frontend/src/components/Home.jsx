import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Laptop, Shield, Zap, UserPlus, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:4001/api/v1';

const Home = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              LappyShoppy
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your ultimate destination for premium laptops. Discover the latest models from top brands at unbeatable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#products"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Laptop className="w-5 h-5" />
              <span>Browse Products</span>
            </a>
            <Link
              to="/register"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl border-2 border-blue-600 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Sign Up</span>
            </Link>
          </div>
        </div>

        {/* Products Section */}
        <div id="products" className="mt-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
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
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading more products...</span>
                </div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">You've reached the end of our catalog!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
            <div className="flex justify-center mb-4">
              <Laptop className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Premium Selection
            </h3>
            <p className="text-gray-600 text-center">
              Curated collection of the best laptops from leading brands worldwide.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Secure Shopping
            </h3>
            <p className="text-gray-600 text-center">
              Shop with confidence using our secure Firebase authentication system.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
            <div className="flex justify-center mb-4">
              <Zap className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Fast Delivery
            </h3>
            <p className="text-gray-600 text-center">
              Quick and reliable delivery to get your new laptop to you as soon as possible.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Laptop?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of satisfied customers who trust LappyShoppy for their laptop needs.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product }) => {
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
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 h-14">
          {product.name}
        </h3>
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
