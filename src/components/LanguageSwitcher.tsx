import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('settings');
  const { toast } = useToast();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    
    toast({
      title: t('language_updated', { ns: 'common' }),
      description: t('language_updated_desc', { ns: 'common' }),
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language">{t('language')}</Label>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}