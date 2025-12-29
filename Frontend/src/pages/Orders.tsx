import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaCheckCircle, FaClock, FaTruck } from 'react-icons/fa';

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  shippingAddress?: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered'>('all');

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/order/user-orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setOrders(result.orders || []);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return ['pending', 'processing', 'shipped'].includes(order.status);
    if (filterStatus === 'delivered') return order.status === 'delivered';
    return true;
  });

  const pendingCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="inline mr-1" />;
      case 'shipped':
        return <FaTruck className="inline mr-1" />;
      case 'processing':
        return <FaClock className="inline mr-1" />;
      case 'pending':
        return <FaBox className="inline mr-1" />;
      default:
        return <FaBox className="inline mr-1" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage all your orders</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{orders.length}</p>
              </div>
              <FaBox className="text-4xl text-teal-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Orders</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
              </div>
              <FaClock className="text-4xl text-orange-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Delivered Orders</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{deliveredCount}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-200" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              filterStatus === 'all'
                ? 'bg-teal-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-teal-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              filterStatus === 'delivered'
                ? 'bg-teal-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Delivered ({deliveredCount})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping!" 
                : `No ${filterStatus} orders found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="text-lg font-bold text-gray-800">#{order.orderId}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order Date</p>
                      <p className="text-gray-800 font-medium">
                        {new Date(order.orderDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {order.deliveryDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Delivery Date</p>
                        <p className="text-gray-800 font-medium">
                          {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Items ({order.products.length})</p>
                    <div className="space-y-2">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>{product.productName} x {product.quantity}</span>
                          <span>${(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-teal-600">${order.totalPrice.toFixed(2)}</p>
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

export default Orders;
