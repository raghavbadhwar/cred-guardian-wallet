import { useTranslation } from 'react-i18next';
import { BackupCard } from '@/components/BackupCard';

export default function BackupSettings() {
  const { t } = useTranslation('settings');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('backup_restore')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('backup_restore_desc')}
        </p>
      </div>

      <BackupCard />
    </div>
  );
}