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
  export const CarCard = ({ car }: CarCardProps) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(price);
    };
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
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
            className="w-full mt-3 py-2 px-4 text-sm font-medium text-[#DC2626] border border-[#DC2626] rounded-lg hover:bg-[#DC2626] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2"
            aria-label={`View details for ${car.make} ${car.model}`}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };
  
  
  
  
  
  