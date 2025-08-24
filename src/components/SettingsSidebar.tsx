import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  User, 
  Shield, 
  Download, 
  Smartphone,
  Settings as SettingsIcon
} from 'lucide-react';

const settingsRoutes = [
  {
    path: '/settings',
    label: 'general',
    icon: SettingsIcon,
  },
  {
    path: '/settings/account',
    label: 'account',
    icon: User,
  },
  {
    path: '/settings/security',
    label: 'security',
    icon: Shield,
  },
  {
    path: '/settings/backup',
    label: 'backup',
    icon: Download,
  },
  {
    path: '/settings/devices',
    label: 'devices',
    icon: Smartphone,
  },
];

export function SettingsSidebar() {
  const location = useLocation();
  const { t } = useTranslation('settings');

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
      </div>
      
      <nav className="px-3 space-y-1">
        {settingsRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = location.pathname === route.path;
          
          return (
            <Link
              key={route.path}
              to={route.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(route.label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}