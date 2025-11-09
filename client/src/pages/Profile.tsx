import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { CarRecCard } from '../components/CarRecCard';

// Helper function to get car ID (same as in CarRecCard)
const getCarId = (car: { model: string; year: number; totalCost: number }) => {
  return `${car.year}-${car.model}-${car.totalCost}`;
};

export const Profile = () => {
  const { currentUser } = useAuth();
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`saved_vehicles_${currentUser.uid}`);
        if (saved) {
          setSavedVehicles(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved vehicles:', error);
      }
    }
  }, [currentUser]);

  // Listen for storage changes to update saved vehicles
  useEffect(() => {
    const handleStorageChange = () => {
      if (currentUser) {
        try {
          const saved = localStorage.getItem(`saved_vehicles_${currentUser.uid}`);
          if (saved) {
            setSavedVehicles(JSON.parse(saved));
          } else {
            setSavedVehicles([]);
          }
        } catch (error) {
          console.error('Error loading saved vehicles:', error);
          setSavedVehicles([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('savedVehiclesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedVehiclesUpdated', handleStorageChange);
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
          <h1 className="mb-4">Profile</h1>
          
          {/* User Information */}
          <div className="bg-container-primary rounded-lg border border-container-stroke p-6 mb-6">
            <h2 className="mb-4">User Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark">Email</label>
                <p className="mt-1 text-text-dark">{currentUser?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dark">User ID</label>
                <p className="mt-1 text-text-secondary text-sm">{currentUser?.uid}</p>
              </div>
            </div>
          </div>

          {/* Saved Vehicles */}
          <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
            <h2 className="mb-4">Saved Vehicles</h2>
            {savedVehicles.length === 0 ? (
              <p className="text-text-secondary">No saved vehicles yet. Heart cars on the Comparison page to save them here.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedVehicles.map((car, index) => (
                  <CarRecCard key={`${getCarId(car)}-${index}`} carData={car} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
