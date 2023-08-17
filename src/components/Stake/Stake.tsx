import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useState } from 'react';
import { YEAR_IN_MS } from '../../constants';
import { useWallet } from '../../hooks';
import Claim from './Claim';
import Connected from './Connected';
import NotConnected from './NotConnected';
import Preview from './Preview';

import './Stake.scss';
import Withdraw from './Withdraw';

export type StakePage = 'default' | 'preview' | 'withdraw' | 'claim';

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
          goToPage={setStep}
        />
      );
    case 'preview':
      return <Preview amountToLock={amountToLock} deadline={deadline} goToPage={setStep} />;
    case 'withdraw':
      return <Withdraw goToPage={setStep} />;
    case 'claim':
      return <Claim goToPage={setStep} />;
  }

  return null;
};

export default memo(Stake);
