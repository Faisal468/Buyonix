import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const SellerAnalytics = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg relative">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="BUYONIX" className="h-10 w-10" />
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-2">
            <Link
              to="/seller-dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📊</span>
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/seller-products"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📦</span>
              <span>Products</span>
            </Link>
            
            <Link
              to="/seller-orders"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📋</span>
              <span>Orders</span>
            </Link>
            
            <Link
              to="/seller-analytics"
              className="flex items-center space-x-3 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium"
            >
              <span className="text-xl">📈</span>
              <span>Analytics</span>
            </Link>
            
            <Link
              to="/seller-payouts"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">💰</span>
              <span>Payouts</span>
            </Link>
          </div>
        </nav>

        {/* Logout and Back to Shopping */}
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <button
            onClick={async () => {
              try {
                await fetch('http://localhost:5000/seller/logout', {
                  method: 'POST',
                  credentials: 'include',
                });
              } catch (error) {
                console.error('Logout error:', error);
              }
              localStorage.removeItem('sellerInfo');
              localStorage.removeItem('sellerId');
              navigate('/become-seller');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            <span>←</span>
            <span>Back to Shopping</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-600 mt-1">View your sales analytics and insights</p>
        </div>

        {/* Analytics Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600">Analytics will appear here once you start making sales.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
