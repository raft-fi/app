import { memo, useState } from 'react';
import { useWallet } from '../../hooks';
import Connected from './Connected';
import NotConnected from './NotConnected';

import './Stake.scss';

const Stake = () => {
  const wallet = useWallet();
  const [step, setStep] = useState<number>(1);
  const [amountToLock, setAmountToLock] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();

  if (!wallet) {
    return (
      <NotConnected
        amountToLock={amountToLock}
        deadline={deadline}
        onAmountChange={setAmountToLock}
        onDeadlineChange={setDeadline}
      />
    );
  }

  if (step === 1) {
    return (
      <Connected
        amountToLock={amountToLock}
        deadline={deadline}
        onAmountChange={setAmountToLock}
        onDeadlineChange={setDeadline}
        onNextStep={() => setStep(2)}
      />
    );
  }

  return null;
};

export default memo(Stake);
