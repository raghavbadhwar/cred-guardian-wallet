import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SettingsSidebar } from '@/components/SettingsSidebar';
import { useTranslation } from 'react-i18next';

export default function SettingsLayout() {
  const { t } = useTranslation('settings');

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('title')} />
      
      <div className="flex">
        <SettingsSidebar />
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}