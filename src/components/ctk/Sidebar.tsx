import React from 'react';
import { 
  Users, UserPlus, Stethoscope, Dumbbell, CreditCard, 
  DollarSign, Package, Calendar, BarChart3, Home, 
  Settings, LogOut, ChevronLeft, ChevronRight, Shield, FileText, Paperclip
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: 'admin' | 'agent';
  onLogout: () => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  collapsed, 
  setCollapsed,
  userRole,
  onLogout,
  isMobile,
  mobileOpen,
  setMobileOpen
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
    { id: 'clients', label: 'Gestion Clients', icon: UserPlus },
    { id: 'fiches_suivi', label: 'Fiches Suivi', icon: FileText },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'kinesitherapie', label: 'Kinésithérapie', icon: Stethoscope },
    { id: 'gym', label: 'Abonnement Gym', icon: Dumbbell },
    { id: 'paiements', label: 'Paiements', icon: CreditCard },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'stocks', label: 'Gestion Stocks', icon: Package },
    { id: 'rendezvous', label: 'Rendez-vous', icon: Calendar },
    { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
    { id: 'rapports', label: 'Rapports', icon: Paperclip },
  ];

  const adminOnlyItems = ['personnel', 'finance', 'statistiques', 'rapports'];

  const filteredMenuItems = userRole === 'admin' 
    ? menuItems 
    : menuItems.filter(item => !adminOnlyItems.includes(item.id));

  const isMobileMode = isMobile ?? false;
  const mobileVisible = mobileOpen ?? false;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 z-50 shadow-2xl ${
        isMobileMode
          ? `w-64 transform ${mobileVisible ? 'translate-x-0' : '-translate-x-full'} lg:hidden`
          : collapsed
            ? 'w-20'
            : 'w-64'
      }`}
      style={isMobileMode ? { minHeight: '100vh' } : undefined}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/696faca652fe36008fa92531_1768926542042_42a9b869.png"
            alt="CTK Logo"
            className={`transition-all duration-300 ${collapsed ? 'w-12 h-12' : 'w-16 h-16'}`}
          />
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-green-400">CTK</h1>
              <p className="text-xs text-gray-400">Kinésithérapie</p>
            </div>
          )}
        </div>
      </div>

      {/* User Role Badge */}
      <div className={`px-4 py-3 border-b border-gray-700 ${collapsed ? 'text-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <Shield className={`w-4 h-4 ${userRole === 'admin' ? 'text-yellow-400' : 'text-blue-400'}`} />
          {!collapsed && (
            <span className={`text-sm font-medium ${userRole === 'admin' ? 'text-yellow-400' : 'text-blue-400'}`}>
              {userRole === 'admin' ? 'Administrateur' : 'Agent'}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center px-4 py-3 transition-all duration-200 ${
                isActive 
                  ? 'bg-green-600 text-white border-r-4 border-green-400' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'
              } ${collapsed ? 'justify-center' : 'gap-3'}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700">
        {isMobileMode && setMobileOpen && (
          <button
            onClick={() => setMobileOpen(!mobileVisible)}
            className="w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 transition-all"
          >
            Fermer le menu
          </button>
        )}
        {userRole === 'admin' && (
          <button
            onClick={() => setCurrentPage('utilisateurs')}
            className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-green-400 transition-all ${
              currentPage === 'utilisateurs' ? 'bg-green-600 text-white' : ''
            } ${collapsed ? 'justify-center' : 'gap-3'}`}
            title={collapsed ? 'Utilisateurs' : undefined}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Utilisateurs</span>}
          </button>
        )}
        
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-900/30 transition-all ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-3 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
