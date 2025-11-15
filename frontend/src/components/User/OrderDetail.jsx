import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
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

      const { data } = await axios.get(`${API_URL}/order/${id}`, config);
      setOrder(data.order);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'Shipped':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'Delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'Cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 inline-block"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Orders</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">Order Details</h1>
                <p className="text-blue-100">Order ID: {order._id}</p>
                <p className="text-blue-100 text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.orderStatus)}
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Shipping Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Shipping Information</span>
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-900"><span className="font-semibold">Address:</span> {order.shippingInfo.address}</p>
                <p className="text-gray-900"><span className="font-semibold">City:</span> {order.shippingInfo.city}</p>
                <p className="text-gray-900"><span className="font-semibold">Postal Code:</span> {order.shippingInfo.postalCode}</p>
                <p className="text-gray-900"><span className="font-semibold">Phone:</span> {order.shippingInfo.phoneNo}</p>
                <p className="text-gray-900"><span className="font-semibold">Country:</span> {order.shippingInfo.country}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Payment Information</span>
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-900"><span className="font-semibold">Method:</span> {order.paymentInfo.id === 'COD' ? 'Cash on Delivery' : 'Card Payment'}</p>
                <p className="text-gray-900"><span className="font-semibold">Status:</span> {order.paymentInfo.status === 'paid' ? 'Paid' : 'Pending'}</p>
                {order.paidAt && (
                  <p className="text-gray-900"><span className="font-semibold">Paid At:</span> {new Date(order.paidAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div 
                  key={index} 
                  onClick={() => navigate(`/product/${item.product}`)}
                  className="flex gap-4 bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition duration-200"
                >
                  <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition duration-200">{item.name}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 border-t bg-gray-50">
            <div className="max-w-md ml-auto space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₱{order.itemsPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₱{order.taxPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">₱{order.shippingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-blue-600">
                  ₱{order.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
