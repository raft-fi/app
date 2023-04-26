import { FC, useEffect } from 'react';
import { subscribeENS } from '../../hooks';

const HookSubscriber: FC = () => {
  // to keep at least one subscriber of the stream insides the state hooks

  // subscribe for the steam$ of the polling hooks
  useEffect(() => {
    subscribeENS();
  }, []);

  return null;
};

export default HookSubscriber;
