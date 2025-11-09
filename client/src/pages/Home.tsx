import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { OnboardingModal } from '../components/OnboardingModal';
import { CarCard } from '../components/CarCard';
import { Header } from '../components/Header';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import api from '../config/api2';
interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  imageUrl: string;
  link?: string;
}

export const Home = () => {
  const { currentUser, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Search form state
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState('');
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  const carouselImages = [
    '/home/home-1.png',
    '/home/home0.png',
    '/home/home1.png',
    '/home/home.png',
  ];
  // Mock car data - all Toyota cars
  const mockCars: Car[] = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      price: 22000,
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    },
    {
      id: '3',
      make: 'Toyota',
      model: 'RAV4',
      year: 2023,
      price: 32000,
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    },
    {
      id: '4',
      make: 'Toyota',
      model: 'Highlander',
      year: 2023,
      price: 38000,
      imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
    },
    {
      id: '5',
      make: 'Toyota',
      model: '4Runner',
      year: 2023,
      price: 40000,
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
    },
    {
      id: '6',
      make: 'Toyota',
      model: 'Prius',
      year: 2023,
      price: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=300&fit=crop',
    },
    {
      id: '7',
      make: 'Toyota',
      model: 'Tacoma',
      year: 2023,
      price: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    },
    {
      id: '8',
      make: 'Toyota',
      model: 'Sienna',
      year: 2023,
      price: 36000,
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    },
  ];
  // Mock data for dropdowns - only Toyota models
  const carModels = ['Camry', 'Corolla', 'RAV4', 'Highlander', '4Runner', 'Prius', 'Tacoma', 'Sienna', 'Tundra', 'Sequoia', 'Land Cruiser Amazon', 'Land Cruiser', 'GT86', 'Yarris'];
  const years = Array.from({ length: 2024 - 1990 + 1 }, (_, i) => (1990 + i).toString());


  // Handle click on home screen to open onboarding modal
  const handleHomeClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements or car cards
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'A' ||
      target.tagName === 'IMG' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('form') ||
      target.closest('[class*="bg-white border"]') // Car cards have this styling
    ) {
      return;
    }

    if (currentUser) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${currentUser.uid}`);
      if (!hasCompletedOnboarding && !showOnboarding) {
        setShowOnboarding(true);
      }
    }
  };


  const handleOnboardingComplete = (creditScore: number, budget: number) => {
    if (currentUser) {
      localStorage.setItem(`onboarding_${currentUser.uid}`, 'true');
      localStorage.setItem(`user_preferences_${currentUser.uid}`, JSON.stringify({
        creditScore,
        budget,
      }));
      setShowOnboarding(false);
    }
  };
  
  const [searchResults, setSearchResults] = useState<Car[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!carModel || !year) {
      setSearchError('Please select both car model and year');
      return;
    }
  
    setIsSearching(true);
    setSearchError('');
  
    try {
      // Call backend API with POST (backend only accepts POST)
      const response = await api.post('/api/search', {
        make: 'Toyota',
        model: carModel,
        year: year,
      });
  
      // ✅ Access JSON data properly - api.post returns the JSON directly
      // Handle Flask's structured response
      const listings = response.listings || response.data || [];
  
      if (!Array.isArray(listings)) {
        console.error('Listings is not an array:', listings);
        setSearchError('Invalid response format from API');
        setSearchResults([]);
        return;
      }
  
      // Transform data
      const transformedCars: Car[] = listings.map((listing: any, index: number) => {
        const vehicle = listing.vehicle || {};
        const retailListing = listing.retailListing || {};
        const vin = listing.vin || listing["@id"]?.split("/").pop() || `search-${index}`;
        
        return {
          id: vin,
          make: vehicle.make || 'Toyota',
          model: vehicle.model || carModel,
          year: vehicle.year || parseInt(year),
          price: retailListing.price || 0,
          imageUrl: retailListing.primaryImage || 'https://via.placeholder.com/400x300',
          link: retailListing.vdp || undefined,
        };
      });
  
      setSearchResults(transformedCars);
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError(
        error.response?.data?.error ||
        error.message ||
        'Failed to search for cars. Please try again.'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Check if user needs onboarding when they first land on the page
  useEffect(() => {
    // Wait for auth to finish loading
    if (!loading && currentUser) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${currentUser.uid}`);
      const justSignedUp = sessionStorage.getItem('justSignedUp');
      
      if (!hasCompletedOnboarding || justSignedUp === 'true') {
        // Clear the justSignedUp flag
        if (justSignedUp === 'true') {
          sessionStorage.removeItem('justSignedUp');
        }
        // Small delay to ensure the component is fully rendered
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, loading]);

  // Listen for custom event to show onboarding modal from header
  useEffect(() => {
    const handleShowModal = () => {
      if (currentUser) {
        setShowOnboarding(true);
      }
    };

    window.addEventListener('showOnboardingModal', handleShowModal);
    return () => {
      window.removeEventListener('showOnboardingModal', handleShowModal);
    };
  }, [currentUser]);
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      {/* Header */}
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        {/* Sidebar - Keep as is, do not modify */}
        <Sidebar />
        {/* Main Content Area */}
        <main 
          className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 w-full overflow-auto cursor-pointer"
          onClick={handleHomeClick}
        >
          {/* Top Search Section */}
          <div className="bg-background-light px-4 sm:px-8 md:px-16">
            <div className="flex flex-col md:flex-row items-start md:items-center pt-4 justify-between gap-4 md:gap-0">
              {/* Left side text */}
              <p className="text-lg font-medium text-[#333333]">
                Looking for a specific car?
              </p>
              {/* Right side search form - only Car Model and Year */}
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto"
              >
                {/* Car Model Dropdown */}
                <select
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 w-full sm:w-40 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>Car Model</option>
                  {carModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                {/* Year Dropdown */}
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 w-full sm:w-40 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>Year</option>
                  {years.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                {/* Search Button */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#DC2626] text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-[#B91C1C] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
            {/* Error Message */}
            {searchError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {searchError}
              </div>
            )}
          </div>
          {/* Carousel Section */}
          <div className="px-4 sm:px-8 md:px-16 mt-8">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg">
              {/* Carousel Container */}
              <div className="relative aspect-[16/9] bg-container-secondary">
                {/* Images */}
                <div className="relative w-full h-full">
                  {carouselImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Carousel image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-container-primary/80 hover:bg-container-primary rounded-full flex items-center justify-center transition-all shadow-lg z-10"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6 text-text-dark" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-container-primary/80 hover:bg-container-primary rounded-full flex items-center justify-center transition-all shadow-lg z-10"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6 text-text-dark" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-primary w-8'
                          : 'bg-container-primary/50 hover:bg-container-primary'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Bottom Corner Icons */}
                <div className="absolute bottom-4 right-4 flex gap-3 z-10">
                  {/* Video Icon */}
                  <a
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-container-primary/80 hover:bg-container-primary rounded-full flex items-center justify-center transition-all shadow-lg group"
                    aria-label="Watch video"
                  >
                    <Play className="w-5 h-5 text-text-dark group-hover:text-primary transition-colors" fill="currentColor" />
                  </a>

                  {/* Info Icon - Expands on hover */}
                  <div
                    className="relative"
                    onMouseEnter={() => setIsInfoHovered(true)}
                    onMouseLeave={() => setIsInfoHovered(false)}
                  >
                    <button
                      className="w-10 h-10 bg-container-primary/80 hover:bg-container-primary rounded-full flex items-center justify-center transition-all shadow-lg group"
                      aria-label="More information"
                    >
                      <Info className="w-5 h-5 text-text-dark group-hover:text-primary transition-colors" />
                    </button>
                    {/* Expanded Name on Hover */}
                    <div
                      className={`absolute bottom-full right-0 mb-2 px-3 py-2 bg-text-dark text-text-light text-sm rounded-lg whitespace-nowrap transition-all duration-200 shadow-lg ${
                        isInfoHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                      }`}
                    >
                      CarCents
                      <div className="absolute top-full right-4 -mt-1">
                        <div className="border-4 border-transparent border-t-text-dark"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Section */}
          <div className="px-4 sm:px-8 md:px-16 mt-16 pb-16">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-8">
              {searchResults.length > 0 ? 'Search Results' : 'Recommended Cars for You'}
            </h2>
            {/* Loading State */}
            {isSearching && (
              <div className="text-center py-8 text-text-secondary">
                Loading cars...
              </div>
            )}
            {/* Error State */}
            {searchError && !isSearching && (
              <div className="text-center py-8 text-red-600">
                {searchError}
              </div>
            )}
            {/* Car Cards Grid */}
            {!isSearching && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : !isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};
