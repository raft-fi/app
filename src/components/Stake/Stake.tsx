import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useState } from 'react';
import { YEAR_IN_MS } from '../../constants';
import { useWallet } from '../../hooks';
import Connected from './Connected';
import NotConnected from './NotConnected';
import Preview from './Preview';

import './Stake.scss';

type StakePage = 'default' | 'preview' | 'withdraw' | 'claim';

const Stake = () => {
  const wallet = useWallet();
  const [step, setStep] = useState<StakePage>('default');
  const [amountToLock, setAmountToLock] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();
  const [period, setPeriod] = useState<number>();

  const onDeadlineChange = useCallback((value: Date) => {
    console.log('deadline', value);
    setDeadline(value);
    setPeriod(undefined);
  }, []);
  const onPeriodChange = useCallback((year: number) => {
    setDeadline(addMilliseconds(startOfDay(new Date()), year * YEAR_IN_MS));
    setPeriod(year);
  }, []);

  const goToDefaultPage = useCallback(() => setStep('default'), []);
  const goToPreviewPage = useCallback(() => setStep('preview'), []);
  const goToWithdrawPage = useCallback(() => setStep('withdraw'), []);
  const goToClaimPage = useCallback(() => setStep('claim'), []);

  if (!wallet) {
    return (
      <NotConnected
        amountToLock={amountToLock}
        deadline={deadline}
        period={period}
        onAmountChange={setAmountToLock}
        onDeadlineChange={onDeadlineChange}
        onPeriodChange={onPeriodChange}
      />
    );
  }

  switch (step) {
    case 'default':
      return (
        <Connected
          amountToLock={amountToLock}
          deadline={deadline}
          period={period}
          onAmountChange={setAmountToLock}
          onDeadlineChange={onDeadlineChange}
          onPeriodChange={onPeriodChange}
          onNextStep={goToPreviewPage}
        />
      );
    case 'preview':
      return (
        <Preview
          amountToLock={amountToLock}
          deadline={deadline}
          onPrevStep={goToDefaultPage}
          onNextStep={goToWithdrawPage}
        />
      );
  }

  return null;
};

export default memo(Stake);
