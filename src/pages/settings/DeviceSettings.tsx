import { useTranslation } from 'react-i18next';
import { DeviceListCard } from '@/components/DeviceListCard';
import { DangerZoneCard } from '@/components/DangerZoneCard';

export default function DeviceSettings() {
  const { t } = useTranslation('settings');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('devices')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('devices_desc')}
        </p>
      </div>

      <DeviceListCard />
      
      <div className="pt-8">
        <DangerZoneCard />
      </div>
    </div>
  );
}