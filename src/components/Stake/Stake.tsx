import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { YEAR_IN_MS } from '../../constants';
import { useUserVeRaftBalance, useWallet, useWalletAddress } from '../../hooks';
import Adjust from './Adjust';
import HasPosition from './HasPosition';
import NoPositions from './NoPositions';
import NotConnected from './NotConnected';
import PreviewAdjust from './PreviewAdjust';
import PreviewNew from './PreviewNew';

import './Stake.scss';

export type StakePage = 'default' | 'adjust' | 'preview';

const Stake = () => {
  const wallet = useWallet();
  const address = useWalletAddress();
  const userVeRaftBalance = useUserVeRaftBalance();

  const [step, setStep] = useState<StakePage>('default');
  const [amountToLock, setAmountToLock] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();
  const [periodInYear, setPeriodInYear] = useState<number>();

  const hasPosition = useMemo(() => userVeRaftBalance?.bptLockedBalance.gt(0), [userVeRaftBalance?.bptLockedBalance]);

  const onDeadlineChange = useCallback((value: Date) => {
    setDeadline(value);
    setPeriodInYear(undefined);
  }, []);
  const onPeriodChange = useCallback((year: number) => {
    setDeadline(addMilliseconds(startOfDay(new Date()), year * YEAR_IN_MS));
    setPeriodInYear(year);
  }, []);

  useEffect(() => {
    setStep('default');
  }, [address]);

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
      return hasPosition ? (
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
      return hasPosition ? (
        <PreviewAdjust amountToLock={amountToLock} deadline={deadline} goToPage={setStep} />
      ) : (
        <PreviewNew amountToLock={amountToLock} deadline={deadline} goToPage={setStep} />
      );
  }

  return null;
};

export default memo(Stake);
