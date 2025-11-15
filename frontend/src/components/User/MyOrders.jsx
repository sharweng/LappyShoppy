import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Package, Truck, CheckCircle, Clock, Eye, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

const MyOrders = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.get(`${API_URL}/orders/me`, config);
      setOrders(data.orders);
    } catch (err) {
      // Don't show error toast if it's just an empty orders response
      if (err.response?.status !== 404) {
        console.error('Error loading orders:', err);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'Delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Cancelled':
        return <Package className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders.slice().sort((a, b) => {
        // Delivered orders go to bottom, others at top
        const aIsDelivered = a.orderStatus === 'Delivered' ? 1 : 0;
        const bIsDelivered = b.orderStatus === 'Delivered' ? 1 : 0;
        
        if (aIsDelivered !== bIsDelivered) {
          return aIsDelivered - bIsDelivered;
        }
        
        // Within same group, sort by date (latest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    : orders.filter(order => order.orderStatus === filter).slice().sort((a, b) => {
        // Sort by date (latest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('Processing')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                filter === 'Processing'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Processing ({orders.filter(o => o.orderStatus === 'Processing').length})
            </button>
            <button
              onClick={() => setFilter('Shipped')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                filter === 'Shipped'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shipped ({orders.filter(o => o.orderStatus === 'Shipped').length})
            </button>
            <button
              onClick={() => setFilter('Delivered')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                filter === 'Delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered ({orders.filter(o => o.orderStatus === 'Delivered').length})
            </button>
            <button
              onClick={() => setFilter('Cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                filter === 'Cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({orders.filter(o => o.orderStatus === 'Cancelled').length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No Orders Yet' : `No ${filter} Orders`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "Start shopping and your orders will appear here" 
                : `You don't have any ${filter.toLowerCase()} orders`
              }
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Order ID: {order._id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.orderStatus)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="space-y-3 mb-4">
                    {order.orderItems.slice(0, 2).map((item, index) => (
                      <div 
                        key={index} 
                        onClick={() => navigate(`/product/${item.product}`)}
                        className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition duration-200"
                      >
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm hover:text-blue-600 transition duration-200">{item.name}</h3>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.orderItems.length > 2 && (
                      <p className="text-sm text-gray-600 pl-19">
                        +{order.orderItems.length - 2} more item{order.orderItems.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₱{order.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/order/${order._id}`)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
                    >
                      <Eye className="w-5 h-5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
