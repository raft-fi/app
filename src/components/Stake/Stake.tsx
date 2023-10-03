import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useState } from 'react';
import { YEAR_IN_MS } from '../../constants';
import { useUserVeRaftBalance, useWallet } from '../../hooks';
import Adjust from './Adjust';
import HasPosition from './HasPosition';
import NoPositions from './NoPositions';
import NotConnected from './NotConnected';
import Preview from './Preview';

import './Stake.scss';

export type StakePage = 'default' | 'preview' | 'adjust' | 'withdraw' | 'claim';

const Stake = () => {
  const wallet = useWallet();
  const userVeRaftBalance = useUserVeRaftBalance();

  const [step, setStep] = useState<StakePage>('default');
  const [amountToLock, setAmountToLock] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();
  const [periodInYear, setPeriodInYear] = useState<number>();

  const onDeadlineChange = useCallback((value: Date) => {
    setDeadline(value);
    setPeriodInYear(undefined);
  }, []);
  const onPeriodChange = useCallback((year: number) => {
    setDeadline(addMilliseconds(startOfDay(new Date()), year * YEAR_IN_MS));
    setPeriodInYear(year);
  }, []);

  if (!wallet) {
    return (
      <NotConnected
        amountToLock={amountToLock}
        deadline={deadline}
        periodInYear={periodInYear}
        onAmountChange={setAmountToLock}
        onDeadlineChange={onDeadlineChange}
        onPeriodChange={onPeriodChange}
      />
    );
  }

  switch (step) {
    case 'default':
      return userVeRaftBalance?.bptLockedBalance.gt(0) ? (
        <HasPosition goToPage={setStep} />
      ) : (
        <NoPositions
          amountToLock={amountToLock}
          deadline={deadline}
          periodInYear={periodInYear}
          onAmountChange={setAmountToLock}
          onDeadlineChange={onDeadlineChange}
          onPeriodChange={onPeriodChange}
          goToPage={setStep}
        />
      );
    case 'adjust':
      return (
        <Adjust
          amountToLock={amountToLock}
          deadline={deadline}
          periodInYear={periodInYear}
          onAmountChange={setAmountToLock}
          onDeadlineChange={onDeadlineChange}
          onPeriodChange={onPeriodChange}
          goToPage={setStep}
        />
      );
    case 'preview':
      return <Preview amountToLock={amountToLock} deadline={deadline} goToPage={setStep} />;
  }

  return null;
};

export default memo(Stake);
