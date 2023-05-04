import { FC, useEffect } from 'react';
import { subscribeENS, subscribeTakenBalances, subscribeTakenPrices } from '../../hooks';

const HookSubscriber: FC = () => {
  // to keep at least one subscriber of the stream insides the state hooks

  // subscribe for the steam$ of the polling hooks
  useEffect(() => {
    subscribeENS();
    subscribeTakenPrices();
    subscribeTakenBalances();
  }, []);

  return null;
};

export default HookSubscriber;
