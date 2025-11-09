import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    imageUrl: string;
}

interface CarCardProps {
    car: Car;
}

interface SavedCarData {
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
    image?: string;
}

// Helper function to get car ID (consistent with CarRecCard)
const getCarId = (car: { model: string; year: number; totalCost: number }) => {
    return `${car.year}-${car.model}-${car.totalCost}`;
};

// Helper function to convert Car to SavedCarData format
const convertToSavedCarData = (car: Car): SavedCarData => {
    return {
        model: `${car.make} ${car.model}`,
        year: car.year,
        totalCost: car.price,
        suggestedDownPayment: Math.round(car.price * 0.1), // 10% down payment
        image: car.imageUrl || undefined,
    };
};

export const CarCard = ({ car }: CarCardProps) => {
    const { currentUser } = useAuth();
    const [isSaved, setIsSaved] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Helper function to get saved vehicles from localStorage
    const getSavedVehicles = (uid: string): SavedCarData[] => {
        try {
            const saved = localStorage.getItem(`saved_vehicles_${uid}`);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? (parsed as SavedCarData[]) : [];
        } catch {
            return [];
        }
    };

    // Check if car is saved on mount
    useEffect(() => {
        if (currentUser && car) {
            const savedVehicles = getSavedVehicles(currentUser.uid);
            const carData = convertToSavedCarData(car);
            const carId = getCarId(carData);
            setIsSaved(savedVehicles.some(saved => getCarId(saved) === carId));
        }
    }, [currentUser, car]);

    const handleAddToFavorites = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking button
        
        if (!currentUser) {
            alert('Please sign in to save vehicles');
            return;
        }
        
        const savedVehicles = getSavedVehicles(currentUser.uid);
        const carData = convertToSavedCarData(car);
        const carId = getCarId(carData);
        const carIndex = savedVehicles.findIndex(saved => getCarId(saved) === carId);
        
        if (carIndex >= 0) {
            // Remove from saved
            savedVehicles.splice(carIndex, 1);
            setIsSaved(false);
        } else {
            // Add to saved
            savedVehicles.push(carData);
            setIsSaved(true);
        }
        
        localStorage.setItem(`saved_vehicles_${currentUser.uid}`, JSON.stringify(savedVehicles));
        
        // Dispatch custom event to update Profile page
        window.dispatchEvent(new Event('savedVehiclesUpdated'));
    };


    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] relative">
            {/* Car Image */}
            <div className="aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-gray-100">
                <img
                    src={car.imageUrl || `https://via.placeholder.com/400x300?text=${encodeURIComponent(car.make + ' ' + car.model)}`}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(car.make + ' ' + car.model)}`;
                    }}
                />
            </div>
            {/* Car Info */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#1F2937]">
                    {car.make} {car.model}
                </h3>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">{car.year}</span>
                    <span className="text-lg font-bold text-[#1F2937]">
                        {formatPrice(car.price)}
                    </span>
                </div>
                <button
                    onClick={handleAddToFavorites}
                    className={`w-full mt-3 py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 ${
                        isSaved
                            ? 'bg-[#DC2626] text-white border border-[#DC2626]'
                            : 'text-[#DC2626] border border-[#DC2626] hover:bg-[#DC2626] hover:text-white'
                    }`}
                    aria-label={isSaved ? `Remove ${car.make} ${car.model} from saved vehicles` : `Save ${car.make} ${car.model}`}
                >
                    {isSaved ? 'Remove from Saved' : 'Save Vehicle'}
                </button>
            </div>
        </div>
    );
};
  