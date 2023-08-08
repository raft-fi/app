import { memo } from 'react';
import { useWallet } from '../../hooks';
import NotConnected from './NotConnected';

import './Stake.scss';

const Stake = () => {
  const wallet = useWallet();

  if (!wallet) {
    return <NotConnected />;
  }

  return null;
};

export default memo(Stake);
