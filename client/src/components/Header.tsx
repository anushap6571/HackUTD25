import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background-light">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            {/* Red Logo Square */}
            <div className="w-10 h-10 bg-primary rounded"></div>
            
            {/* Vertical Separator */}
            <div className="w-px h-6 bg-text-dark"></div>
            
            {/* Navigation Links - Show different content based on auth state */}
            {currentUser ? (
              <nav className="flex items-center space-x-6">
                <Link
                  to="/home"
                  className={`text-sm font-medium transition ${
                    isActive('/home')
                      ? 'text-text-dark'
                      : 'text-text-secondary hover:text-text-dark'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/analytics"
                  className={`text-sm font-medium transition ${
                    isActive('/analytics')
                      ? 'text-text-dark'
                      : 'text-text-secondary hover:text-text-dark'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition ${
                    isActive('/profile')
                      ? 'text-text-dark'
                      : 'text-text-secondary hover:text-text-dark'
                  }`}
                >
                  Profile
                </Link>
              </nav>
            ) : (
              <nav className="flex items-center space-x-6">
                <Link to="/signup" className="text-sm font-medium text-text-dark hover:text-text-secondary transition">
                  Make an account
                </Link>
                <Link to="/signup" className="text-sm font-medium text-text-dark hover:text-text-secondary transition">
                  Make an account
                </Link>
                <Link to="/signup" className="text-sm font-medium text-text-dark hover:text-text-secondary transition">
                  Make an account
                </Link>
              </nav>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-text-secondary">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-primary text-text-light rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-dark hover:text-text-secondary transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary text-text-light rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  Make an account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

