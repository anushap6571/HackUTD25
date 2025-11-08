import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/home" className="text-xl font-bold text-primary">
                App
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/home"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Home
                </Link>
                <Link
                  to="/analytics"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Home</h1>
        <p className="text-lg text-gray-600 mb-6">
          Welcome, {currentUser?.email}!
        </p>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard</h2>
          <p className="text-gray-600">
            This is your home page. Navigate to Analytics or Profile using the menu above.
          </p>
        </div>
      </main>
    </div>
  );
};

