import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Profile = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-4xl font-bold text-text-dark mb-4">Profile</h1>
        <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
          <h2 className="text-2xl font-semibold text-text-dark mb-4">User Information</h2>
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
      </main>
      <Footer />
    </div>
  );
};

