import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';

export const Profile = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
          <h1 className="mb-4">Profile</h1>
          <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
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
        </main>
      </div>
      <Footer />
    </div>
  );
};

