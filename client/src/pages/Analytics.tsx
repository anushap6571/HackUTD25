import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';

export const Analytics = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
          <h1 className="mb-4">Analytics</h1>
          <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
            <h2 className="mb-4">Analytics Dashboard</h2>
            <p className="text-text-secondary">
              Your analytics data will be displayed here.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

