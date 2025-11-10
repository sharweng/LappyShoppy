import { Link } from 'react-router-dom';
import { Laptop, Shield, Zap, ShoppingBag, UserPlus } from 'lucide-react';

const Home = () => {
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
            <Link
              to="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Shop Now</span>
            </Link>
            <Link
              to="/register"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl border-2 border-blue-600 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Sign Up</span>
            </Link>
          </div>
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

export default Home;
