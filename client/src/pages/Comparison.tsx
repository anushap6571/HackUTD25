import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CarRecCard } from '../components/CarRecCard';
import { CarRecModal } from '../components/CarRecModal';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export const Comparison = () => {
  interface BackendCar {
    car_id: string;
    make: string;
    model: string;
    Entry_price: number;
    year: number;
    image_url?: string;
    down_payment?: number;
    down_payment_rate?: number;
  }

  interface CarCardData {
    id: string;
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
    image?: string;
  }

  interface UserProfile {
    budget?: number;
    credit_score?: number;
    display_name?: string;
  }

  const { currentUser } = useAuth();

  const [cars, setCars] = useState<CarCardData[]>([]);
  const [leftCardIndex, setLeftCardIndex] = useState<number | null>(null);
  const [rightCardIndex, setRightCardIndex] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarCardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const mapBackendCar = (car: BackendCar): CarCardData => {
    const entryPrice = Number(car.Entry_price ?? 0);
    const downPayment = car.down_payment != null ? Number(car.down_payment) : entryPrice * 0.1;

    return {
      id: car.car_id,
      model: car.model,
      year: Number(car.year),
      totalCost: entryPrice,
      suggestedDownPayment: Math.round(downPayment),
      image: car.image_url,
    };
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userResponse = await api.get(`/users/${currentUser.uid}`);
        const profile: UserProfile | undefined = userResponse?.user;

        if (!profile?.budget || !profile?.credit_score) {
          setUserProfile(profile || null);
          setCars([]);
          setError('Please complete your profile with a budget and credit score to view car recommendations.');
          return;
        }

        setUserProfile(profile);

        const carsResponse = await api.get(`/cars/${currentUser.uid}`);
        const fetchedCars: BackendCar[] = carsResponse?.cars || [];

        if (fetchedCars.length === 0) {
          setCars([]);
          setLeftCardIndex(0);
          setRightCardIndex(1);
          setError('No cars found within your budget.');
          return;
        }

        const mappedCars = fetchedCars.map(mapBackendCar);
        setCars(mappedCars);

        const initialEvenIndex = mappedCars.findIndex((_, index) => index % 2 === 0);
        const initialOddIndex = mappedCars.findIndex((_, index) => index % 2 === 1);

        setLeftCardIndex(initialEvenIndex !== -1 ? initialEvenIndex : null);
        setRightCardIndex(initialOddIndex !== -1 ? initialOddIndex : null);
      } catch (err: any) {
        const message = err?.message || 'Failed to load comparison data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [currentUser]);

  const handleAdvance = async (side: 'left' | 'right') => {
    if (!currentUser || isAdvancing[side]) {
      return;
    }

    setIsAdvancing((prev) => ({ ...prev, [side]: true }));
    setError(null);

    try {
      const response = await api.get(`/cars/${currentUser.uid}/next?side=${side}`);

      if (response?.error) {
        setError(response.message || response.error || 'Reached the end of recommendations.');
        return;
      }

      const backendCar: BackendCar | undefined = response?.car;
      const newIndex: number | undefined = response?.index;

      if (!backendCar || typeof newIndex !== 'number') {
        throw new Error('Invalid response from server when fetching next car.');
      }

      const mappedCar = mapBackendCar(backendCar);
      setCars((prev) => {
        const updated = [...prev];
        if (newIndex >= updated.length) {
          updated.length = newIndex + 1;
        }
        updated[newIndex] = mappedCar;
        return updated;
      });

      if (side === 'left') {
        if (newIndex % 2 !== 0) {
          console.warn(`Received odd index ${newIndex} for left card; ignoring to maintain even indices.`);
        } else {
          setLeftCardIndex(newIndex);
        }
      } else {
        if (newIndex % 2 === 0) {
          console.warn(`Received even index ${newIndex} for right card; ignoring to maintain odd indices.`);
        } else {
          setRightCardIndex(newIndex);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to advance to the next car.';
      setError(message);
    } finally {
      setIsAdvancing((prev) => ({ ...prev, [side]: false }));
    }
  };

  const handleCardClick = (car: CarCardData | null) => {
    // if (!car) return;
    // setSelectedCar(car);
    // setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    // setIsModalOpen(false);
    // setSelectedCar(null);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle chat prompt submission
    console.log('Chat prompt:', chatPrompt);
    setChatPrompt('');
  };

  const leftCar = useMemo(() => {
    if (leftCardIndex === null) return null;
    return cars[leftCardIndex] ?? null;
  }, [cars, leftCardIndex]);

  const rightCar = useMemo(() => {
    if (rightCardIndex === null) return null;
    return cars[rightCardIndex] ?? null;
  }, [cars, rightCardIndex]);

  const isReady = !loading && (leftCar !== null || rightCar !== null);

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-4 px-4 py-4 items-start min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 w-full">
          {userProfile && (
            <div className="mb-4 flex flex-wrap items-center gap-4 bg-container-primary border border-container-stroke rounded-xl px-4 py-3 shadow-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-text-secondary">Budget</div>
                <div className="text-lg font-semibold text-text-dark">
                  {userProfile.budget ? `$${Number(userProfile.budget).toLocaleString()}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-text-secondary">Credit Score</div>
                <div className="text-lg font-semibold text-text-dark">
                  {userProfile.credit_score ?? '—'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">Loading car recommendations...</div>
            </div>
          )}

          {!loading && !currentUser && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">Please sign in to view car recommendations.</div>
            </div>
          )}

          {!loading && currentUser && (!leftCar && !rightCar) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">
                {error ? 'Please update your profile to generate recommendations.' : 'No car recommendations available yet.'}
              </div>
            </div>
          )}

          {/* Chatbot Prompt Input */}
          <div className="mb-4">
            <form onSubmit={handleChatSubmit} className="w-full">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ask about cars, financing, or get recommendations..."
                  className="flex-1 px-4 py-6 border border-container-stroke rounded-lg bg-container-primary text-text-dark placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-6 bg-primary text-text-light rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
          
          {isReady && (
            <>
              {/* Two Cards Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {leftCar ? (
                  <div
                    className={`cursor-pointer ${isAdvancing.left ? 'opacity-70 pointer-events-none' : ''}`}
                    onClick={() => handleCardClick(leftCar)}
                  >
                    <CarRecCard carData={leftCar} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-container-stroke bg-container-primary text-text-secondary text-sm">
                    Generate recommendations to see a primary car.
                  </div>
                )}
                {rightCar ? (
                  <div
                    className={`cursor-pointer ${isAdvancing.right ? 'opacity-70 pointer-events-none' : ''}`}
                    onClick={() => handleCardClick(rightCar)}
                  >
                    <CarRecCard carData={rightCar} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-container-stroke bg-container-primary text-text-secondary text-sm">
                    Generate more recommendations to see a comparison car.
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              <div className="flex justify-center gap-4 pb-2">
                <button
                  onClick={() => handleAdvance('left')}
                  disabled={isAdvancing.left || !leftCar}
                  className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next left recommendation"
                >
                  <ChevronLeft className="w-5 h-5 text-text-dark" />
                </button>
                <button
                  onClick={() => handleAdvance('right')}
                  disabled={isAdvancing.right || !rightCar}
                  className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next right recommendation"
                >
                  <ChevronRight className="w-5 h-5 text-text-dark" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* Car Recommendation Modal */}
      <CarRecModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carData={selectedCar || undefined}
      />
    </div>
  )
}