import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ run, onComplete }: OnboardingTourProps) {
  const { t } = useTranslation('wallet');
  
  const steps: Step[] = [
    {
      target: '[data-tour="create-wallet"]',
      content: t('create_wallet_desc'),
      title: t('create_wallet'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="receive"]',
      content: t('add_credentials_desc'),
      title: t('add_credentials'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="present"]',
      content: t('share_safely_desc'),
      title: t('share_safely'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="backup"]',
      content: t('backup_keys_desc'),
      title: t('backup_keys'),
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
        },
        tooltip: {
          borderRadius: '8px',
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: t('tour_skip', { ns: 'common' }),
      }}
      callback={handleJoyrideCallback}
    />
  );
}