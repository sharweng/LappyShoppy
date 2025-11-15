import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Laptop, Shield, Zap, UserPlus, Loader2, CheckCircle2, Filter, X, ChevronDown, ChevronUp, Star, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

const Home = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const observer = useRef();

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.category !== '' || 
           filters.minPrice !== '' || 
           filters.maxPrice !== '' || 
           filters.brand !== '' || 
           filters.processor !== '' || 
           filters.ram !== '' || 
           filters.storage !== '' || 
           filters.screenSize !== '' || 
           filters.graphics !== '' || 
           filters.operatingSystem !== '' || 
           filters.minRating > 0 ||
           filters.maxRating < 5;
  };

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    processors: [],
    screenSizes: [],
    graphics: []
  });
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    brand: '',
    processor: '',
    ram: '',
    storage: '',
    screenSize: '',
    graphics: '',
    operatingSystem: '',
    minRating: 0,
    maxRating: 5
  });

  // Expandable filter sections
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    specs: false,
    rating: false
  });

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

  const fetchProducts = async (pageNum, resetProducts = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Build query string with filters
      const params = new URLSearchParams({ page: pageNum });
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('price[gte]', filters.minPrice);
      if (filters.maxPrice) params.append('price[lte]', filters.maxPrice);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.processor) params.append('processor', filters.processor);
      if (filters.ram) params.append('ram', filters.ram);
      if (filters.storage) params.append('storage', filters.storage);
      if (filters.screenSize) params.append('screenSize', filters.screenSize);
      if (filters.graphics) params.append('graphics', filters.graphics);
      if (filters.operatingSystem) params.append('operatingSystem', filters.operatingSystem);
      if (filters.minRating > 0) params.append('ratings[gte]', filters.minRating);
      if (filters.maxRating < 5) params.append('ratings[lte]', filters.maxRating);

      const { data } = await axios.get(`${API_URL}/products?${params.toString()}`);
      
      if (data.products.length === 0) {
        setHasMore(false);
        if (resetProducts) {
          setProducts([]);
        }
      } else {
        if (resetProducts) {
          setProducts(data.products);
        } else {
          setProducts((prevProducts) => {
            const newProducts = data.products.filter(
              (newProduct) => !prevProducts.some((p) => p._id === newProduct._id)
            );
            return [...prevProducts, ...newProducts];
          });
        }
        
        // Check if we've loaded all products
        const totalLoaded = resetProducts ? data.products.length : products.length + data.products.length;
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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      // Reset products when filter changes
      setProducts([]);
      setHasMore(true);
      return newFilters;
    });
    // Reset to page 1 when filter changes
    setPage(1);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      processor: '',
      ram: '',
      storage: '',
      screenSize: '',
      graphics: '',
      operatingSystem: '',
      minRating: 0,
      maxRating: 5
    };
    setFilters(clearedFilters);
    setProducts([]);
    setPage(1);
    setHasMore(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/products/filter-options`);
        setFilterOptions(data.filters);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch products when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    } else {
      fetchProducts(1, true);
    }
  }, [page, JSON.stringify(filters)]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex-grow w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Our Premium Laptops
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-blue-600 transition duration-300"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        <div className="flex gap-6">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-lg h-fit sticky top-20">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-240px)] p-4">
                  {/* Price Filter */}
                  <div className="mb-4 border-b pb-3">
                    <button
                      onClick={() => toggleSection('price')}
                      className="flex justify-between items-center w-full mb-2"
                    >
                      <h4 className="font-semibold text-sm text-gray-900">Price Range</h4>
                      {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.price && (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          placeholder="Min (₱)"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          placeholder="Max (₱)"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-4 border-b pb-3">
                    <button
                      onClick={() => toggleSection('category')}
                      className="flex justify-between items-center w-full mb-2"
                    >
                      <h4 className="font-semibold text-sm text-gray-900">Category</h4>
                      {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.category && (
                      <div className="space-y-1.5">
                        {['Business Laptop', 'Gaming Laptop', 'Chromebooks', 'Convertible Laptops'].map((cat) => (
                          <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              checked={filters.category === cat}
                              onChange={() => handleFilterChange('category', cat)}
                              className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-gray-700">{cat}</span>
                          </label>
                        ))}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === ''}
                            onChange={() => handleFilterChange('category', '')}
                            className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-gray-700">All</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Specs Filter */}
                  <div className="mb-4 border-b pb-3">
                    <button
                      onClick={() => toggleSection('specs')}
                      className="flex justify-between items-center w-full mb-2"
                    >
                      <h4 className="font-semibold text-sm text-gray-900">Specifications</h4>
                      {expandedSections.specs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.specs && (
                      <div className="space-y-2.5">
                        {/* Brand */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Brand</label>
                          <select
                            value={filters.brand}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Brands</option>
                            {filterOptions.brands.map((brand) => (
                              <option key={brand} value={brand}>{brand}</option>
                            ))}
                          </select>
                        </div>

                        {/* Processor */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Processor</label>
                          <select
                            value={filters.processor}
                            onChange={(e) => handleFilterChange('processor', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Processors</option>
                            {filterOptions.processors.map((processor) => (
                              <option key={processor} value={processor}>{processor}</option>
                            ))}
                          </select>
                        </div>

                        {/* RAM */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">RAM</label>
                          <select
                            value={filters.ram}
                            onChange={(e) => handleFilterChange('ram', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All RAM</option>
                            <option value="4GB">4GB</option>
                            <option value="8GB">8GB</option>
                            <option value="16GB">16GB</option>
                            <option value="32GB">32GB</option>
                          </select>
                        </div>

                        {/* Storage */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Storage</label>
                          <select
                            value={filters.storage}
                            onChange={(e) => handleFilterChange('storage', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Storage</option>
                            <option value="64GB">64GB</option>
                            <option value="128GB">128GB</option>
                            <option value="256GB">256GB</option>
                            <option value="512GB">512GB</option>
                            <option value="1TB">1TB</option>
                            <option value="2TB">2TB</option>
                          </select>
                        </div>

                        {/* Screen Size */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Screen Size</label>
                          <select
                            value={filters.screenSize}
                            onChange={(e) => handleFilterChange('screenSize', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Sizes</option>
                            {filterOptions.screenSizes.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>

                        {/* Graphics */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Graphics</label>
                          <select
                            value={filters.graphics}
                            onChange={(e) => handleFilterChange('graphics', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Graphics</option>
                            {filterOptions.graphics.map((graphic) => (
                              <option key={graphic} value={graphic}>{graphic}</option>
                            ))}
                          </select>
                        </div>

                        {/* Operating System */}
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Operating System</label>
                          <select
                            value={filters.operatingSystem}
                            onChange={(e) => handleFilterChange('operatingSystem', e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All OS</option>
                            <option value="Windows 11 Home">Windows 11 Home</option>
                            <option value="Windows 11 Pro">Windows 11 Pro</option>
                            <option value="macOS Sonoma">macOS Sonoma</option>
                            <option value="macOS Ventura">macOS Ventura</option>
                            <option value="Chrome OS">Chrome OS</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('rating')}
                      className="flex justify-between items-center w-full mb-2"
                    >
                      <h4 className="font-semibold text-sm text-gray-900">Rating Range</h4>
                      {expandedSections.rating ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.rating && (
                      <div className="space-y-3">
                        {/* Min Rating */}
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-2 block">Min Rating</label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={`min-${star}`}
                                type="button"
                                onClick={() => handleFilterChange('minRating', star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                                title={`${star} stars & up`}
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= filters.minRating && filters.minRating > 0
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Max Rating */}
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-2 block">Max Rating</label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={`max-${star}`}
                                type="button"
                                onClick={() => handleFilterChange('maxRating', star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                                title={`${star} stars & below`}
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= filters.maxRating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter Actions - Sticky at bottom */}
                <div className="border-t p-3">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-sm transition duration-300"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : products.length === 0 && !loading ? (
                <div className={`grid ${showFilters ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                  <div className={`${showFilters ? 'lg:col-span-2 xl:col-span-3' : 'md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                      <Laptop className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No products available at the moment.</p>
                      <p className="text-gray-500 text-sm mt-2">Check back later for new arrivals!</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`grid ${showFilters ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
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

                      {!hasMore && products.length > 0 && !hasActiveFilters() && (
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
    </div>
  );
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [showTooltip, setShowTooltip] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const nameRef = useRef(null);

  const isTextTruncated = () => {
    if (nameRef.current) {
      return nameRef.current.scrollWidth > nameRef.current.clientWidth;
    }
    return false;
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.info('Please login to purchase');
      navigate('/login');
      return;
    }
    // Add to cart and go to cart
    addToCart(product);
    navigate('/cart');
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      addToCart(product);
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="relative h-64 overflow-hidden bg-gray-100 cursor-pointer"
      >
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
      <div onClick={handleCardClick} className="p-6 cursor-pointer">
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
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleBuyNow}
            className={`flex-1 py-2 rounded-lg font-semibold transition duration-300 ${
              product.stock > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className={`p-2 rounded-lg transition duration-300 ${
              product.stock > 0
                ? 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600'
                : 'bg-gray-100 text-gray-400 border-2 border-gray-300 cursor-not-allowed'
            }`}
            title="Add to Cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
