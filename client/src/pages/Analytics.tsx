import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Analytics = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-4xl font-bold text-text-dark mb-4">Analytics</h1>
        <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
          <h2 className="text-2xl font-semibold text-text-dark mb-4">Analytics Dashboard</h2>
          <p className="text-text-secondary">
            Your analytics data will be displayed here.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

