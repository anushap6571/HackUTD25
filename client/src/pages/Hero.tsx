import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header/>
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-6">Welcome</h1>
        <p className="text-xl mb-8">Get started by signing in or creating an account</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

