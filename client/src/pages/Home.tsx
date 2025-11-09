import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { OnboardingModal } from '../components/OnboardingModal';
import { CarCard } from '../components/CarCard';
import { Header } from '../components/Header';
interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  imageUrl: string;
}

export const Home = () => {
  const { currentUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Search form state
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState('');
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
  const carModels = ['Camry', 'Corolla', 'RAV4', 'Highlander', '4Runner', 'Prius', 'Tacoma', 'Sienna', 'Tundra', 'Sequoia'];
  const years = ['2024', '2023', '2022', '2021', '2020', '2019'];
  useEffect(() => {
    if (currentUser) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${currentUser.uid}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [currentUser]);
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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', { carModel, year });
    // TODO: Implement actual search functionality
  };
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      {/* Header */}
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        {/* Sidebar - Keep as is, do not modify */}
        <Sidebar />
        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
          {/* Top Search Section */}
          <div className="bg-background-light px-4 sm:px-8 md:px-16 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
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
                  className="bg-[#DC2626] text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-[#B91C1C] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 whitespace-nowrap"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
          {/* Hero Video Section */}
          <div className="px-4 sm:px-8 md:px-16 mt-8">
            <div className="max-w-[1200px] mx-auto">
              {/* Video Container */}
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-lg"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  aria-label="Car dealership promotional video"
                >
                  {/* <source src="/videos/car-commercial.mp4" type="video/mp4" /> */}
                  {/* <source src="/videos/car-commercial.webm" type="video/webm" /> */}
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
          {/* Recommended Section */}
          <div className="px-4 sm:px-8 md:px-16 mt-16 pb-16">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-8">
              Recommended Cars for You
            </h2>
            {/* Car Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
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
