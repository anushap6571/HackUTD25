import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Hero = () => {
  // Use images from carscroller directory (10 images, repeated to make 20)
  const images = Array.from({ length: 20 }, (_, i) => {
    const imageNumber = (i % 10) + 1; // Cycle through 1-10 twice
    return {
      id: i + 1,
      url: `/carscroller/image${imageNumber}.png`,
      alt: `Car ${imageNumber}`
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header/>
      
      {/* Horizontal Image Scroller */}
      <div className="w-full overflow-hidden py-8 mb-8">
        <div className="flex animate-scroll gap-4">
          {/* First set of images */}
          {images.map((image) => (
            <div key={image.id} className="shrink-0 w-64 h-48 rounded-lg overflow-hidden shadow-lg bg-white flex items-center justify-center">
              <img 
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {images.map((image) => (
            <div key={`duplicate-${image.id}`} className="shrink-0 w-64 h-48 rounded-lg overflow-hidden shadow-lg bg-white flex items-center justify-center">
              <img 
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center px-4 pb-20">
        <h1 className="text-6xl font-bold mb-6">Welcome</h1>
        <p className="text-xl mb-8">Get started by signing in or creating an account</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 bg-white border-2 border-white text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

