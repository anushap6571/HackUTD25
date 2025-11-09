import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-container-primary border-t border-container-stroke mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-xl font-bold text-primary mb-4 inline-block">
              CarCents
            </Link>
            <p className="text-text-secondary text-sm mt-2">
              Making cents make sense.
            </p>
          </div>
          <div>
            <h3 className="text-text-dark font-semibold mb-4 text-sm">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-text-secondary text-sm hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-text-secondary text-sm hover:text-primary transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-text-secondary text-sm hover:text-primary transition">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-text-dark font-semibold mb-4 text-sm">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-container-stroke">
          <p className="text-text-secondary text-sm text-center">
            © {currentYear} App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

