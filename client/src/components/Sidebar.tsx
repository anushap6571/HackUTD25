import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, User, GalleryHorizontal, LayoutGrid, MapIcon} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const iconClass = (active: boolean) => {
    const baseClass = 'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out';
    const activeClass = active
      ? 'bg-primary text-text-light'
      : 'bg-container-secondary text-icon-dark';
    const hoverClass = 'hover:bg-icon-light hover:text-button-light-hover';
    return `${baseClass} ${activeClass} ${hoverClass}`;
  };

  return (
    <aside className="w-20 flex-shrink-0 flex-grow-0 bg-container-primary rounded-lg p-4 flex flex-col items-center space-y-3 self-stretch">
      {/* Logo at the top */}
      <div className="mb-2">
        <img src="/logo.png" alt="Logo" className="w-12 h-12" />
      </div>

      {/* Main Navigation Icons */}
      <div className="flex flex-col space-y-3 flex-1">
        {/* Home Icon */}
        <Link 
          to="/home" 
          className={`${iconClass(isActive('/home'))} no-underline`}
        >
          <Home className="w-6 h-6" />
        </Link>

        {/* Window/Panel Icon - Comparison */}
        <Link 
          to="/comparison" 
          className={`${iconClass(isActive('/comparison'))} no-underline`}
        >
          <GalleryHorizontal className="w-6 h-6" />
        </Link>

        {/* Grid/Apps Icon */}
        <Link
          to="/map"
          className={`${iconClass(isActive('/map'))} no-underline`}>
            <LayoutGrid className="w-6 h-6" />
          </Link>

        {/* Chart/Graph Icon */}
        <Link 
          to="/analytics" 
          className={`${iconClass(isActive('/analytics'))} no-underline`}
        >
          <BarChart3 className="w-6 h-6" />
        </Link>
      </div>

      {/* Profile Icon at the bottom */}
      <div className="mt-auto">
        <Link 
          to="/profile" 
          className={`${iconClass(isActive('/profile'))} no-underline`}
        >
          <User className="w-6 h-6" />
        </Link>
      </div>
    </aside>
  );
};
