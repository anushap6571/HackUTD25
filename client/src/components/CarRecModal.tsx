import { useState } from 'react';
import type { ReactNode } from 'react';

interface CarRecModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    image?: string;
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
  };
}

export const CarRecModal = ({ isOpen, onClose, carData }: CarRecModalProps) => {
  // Default car data if not provided
  const defaultCarData = {
    image: '/car-placeholder.jpg', // You can replace this with actual car image
    model: 'Toyota Corolla',
    year: 2026,
    totalCost: 10998,
    suggestedDownPayment: 4998,
  };

  const car = carData || defaultCarData;
  const [loanTerm, setLoanTerm] = useState(50); // Value from 0-100, representing 10-60 months
  const [downPayment, setDownPayment] = useState(50); // Value from 0-100, representing $1000-$10,998

  if (!isOpen) return null;

  // Convert slider value (0-100) to loan term (10-60 months)
  const loanTermMonths = Math.round(10 + (loanTerm / 100) * 50);
  
  // Convert slider value (0-100) to down payment ($1000-$10,998)
  const downPaymentAmount = Math.round(1000 + (downPayment / 100) * 9998);
  
  // Calculate monthly payment (simplified calculation)
  const principal = car.totalCost - downPaymentAmount;
  const monthlyRate = 0.005; // 6% APR / 12 months (simplified)
  const numPayments = loanTermMonths;
  const monthlyPayment = principal > 0 && numPayments > 0
    ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1))
    : 0;

  // Calculate default risk (placeholder calculation)
  const defaultRisk = Math.round((downPaymentAmount / car.totalCost) * 100);

  // Calculate Predicted APR based on down payment percentage and loan term
  // Higher down payment and shorter term = lower APR
  const downPaymentPercentage = (downPaymentAmount / car.totalCost) * 100;
  // Base APR calculation: lower with higher down payment and shorter term
  const baseAPR = 8.0; // Base 8% APR
  const downPaymentDiscount = Math.max(0, (downPaymentPercentage - 20) * 0.1); // Up to 2% discount for high down payment
  const termDiscount = Math.max(0, (60 - loanTermMonths) * 0.02); // Up to 1% discount for shorter term
  const predictedAPR = Math.max(3.0, Math.min(15.0, baseAPR - downPaymentDiscount - termDiscount));
  const predictedAPRFormatted = predictedAPR.toFixed(1);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Tooltip component for terms
  const TermTooltip = ({ term, definition, children }: { term: string; definition: string; children: ReactNode }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <span 
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="underline decoration-primary decoration-2 cursor-help">{children}</span>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-text-dark text-text-light text-xs rounded-lg p-2 shadow-lg z-50 pointer-events-none">
            <div className="font-semibold mb-1">{term}</div>
            <div>{definition}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-text-dark"></div>
            </div>
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-container-primary rounded-xl p-6 max-w-xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Car Image */}
        <div className="flex justify-center mb-4">
          {car.image ? (
            <img 
              src={car.image} 
              alt={car.model}
              className="w-full max-w-xs h-auto rounded-lg object-cover"
            />
          ) : (
            <div className="w-full max-w-xs h-32 bg-container-secondary rounded-lg flex items-center justify-center">
              <span className="text-text-secondary text-xs">Car Image</span>
            </div>
          )}
        </div>

        {/* Car Model */}
        <h2 className="font-semibold text-text-dark text-center mb-3">
          {car.year} {car.model}
        </h2>

        {/* Total Cost */}
        <div className="text-center mb-4">
          <div className="text-xl font-bold text-text-dark mb-1">
            {formatCurrency(car.totalCost)}
          </div>
          <div className="text-sm text-text-secondary">Total Cost</div>
        </div>

        {/* Suggested Down Payment */}
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-text-dark mb-1">
            {formatCurrency(car.suggestedDownPayment)}
          </div>
          <div className="text-sm text-text-secondary">
            <TermTooltip 
              term="Down Payment" 
              definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
            >
              Down Payment
            </TermTooltip>
          </div>
        </div>

        {/* Loan Term Slider */}
        <div className="mb-6">
          <label className="block text-text-dark font-medium mb-3 text-sm">
            <TermTooltip 
              term="Loan Term" 
              definition="The length of time over which the loan will be repaid, typically measured in months. Longer terms result in lower monthly payments but higher total interest."
            >
              Loan Term
            </TermTooltip>
          </label>
          <div className="relative pt-8">
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${loanTerm}% - 0px)` }}
            >
              <div className="bg-primary text-text-light px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap shadow-lg">
                {loanTermMonths} months
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className="relative h-2 bg-container-secondary rounded-full">
                {/* Filled portion (red) */}
                <div 
                  className="absolute h-2 bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${loanTerm}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
                />
                
                {/* Slider Thumb */}
                <div 
                  className="absolute w-5 h-5 bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-y-1.5 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                  style={{ left: `${loanTerm}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className="flex justify-between mt-3 text-sm text-text-secondary">
                <span>10 months</span>
                <span>60 months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Down Payment Slider */}
        <div className="mb-6">
          <label className="block text-text-dark font-medium mb-3 text-sm">
            <TermTooltip 
              term="Down Payment" 
              definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
            >
              Down Payment
            </TermTooltip>
          </label>
          <div className="relative pt-8">
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${downPayment}% - 0px)` }}
            >
              <div className="bg-primary text-text-light px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap shadow-lg">
                {formatCurrency(downPaymentAmount)}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className="relative h-2 bg-container-secondary rounded-full">
                {/* Filled portion (red) */}
                <div 
                  className="absolute h-2 bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${downPayment}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
                />
                
                {/* Slider Thumb */}
                <div 
                  className="absolute w-5 h-5 bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-y-1.5 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                  style={{ left: `${downPayment}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className="flex justify-between mt-3 text-sm text-text-secondary">
                <span>{formatCurrency(1000)}</span>
                <span>{formatCurrency(10998)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-container-stroke">
          {/* Predicted APR */}
          <div className="text-center">
            <div className="text-lg font-semibold text-text-dark mb-1">
              {predictedAPRFormatted}%
            </div>
            <div className="text-xs text-text-secondary">
              <TermTooltip 
                term="Predicted APR" 
                definition="Annual Percentage Rate - the yearly cost of borrowing money, expressed as a percentage. Includes interest and fees. Lower APR means lower overall loan cost."
              >
                Predicted APR
              </TermTooltip>
            </div>
          </div>

          {/* Default Risk */}
          <div className="text-center">
            <div className="text-lg font-semibold text-text-dark mb-1">
              {defaultRisk}%
            </div>
            <div className="text-xs text-text-secondary">
              <TermTooltip 
                term="Default Risk" 
                definition="The likelihood that a borrower will fail to make required loan payments. Calculated based on down payment percentage and other factors."
              >
                Default Risk
              </TermTooltip>
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="text-center">
            <div className="text-lg font-semibold text-text-dark mb-1">
              {formatCurrency(monthlyPayment)}
            </div>
            <div className="text-xs text-text-secondary">
              <TermTooltip 
                term="Monthly Payment" 
                definition="The fixed amount paid each month toward the loan, including both principal (the loan amount) and interest (the cost of borrowing)."
              >
                Monthly Payment
              </TermTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

