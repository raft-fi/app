import { memo, useState } from 'react';
import { useAppLoaded } from '../../hooks';
import { Button, Loading, Typography } from '../shared';
import LoadingSavings from '../LoadingSavings';

import './Savings.scss';

const Savings = () => {
  const appLoaded = useAppLoaded();

  const [transactionState] = useState<string>('default');

  if (!appLoaded) {
    return (
      <div className="raft__savings__container">
        <LoadingSavings />
      </div>
    );
  }

  return (
    <div className="raft__savings__container">
      <div className="raft__savings">
        <Typography variant="heading2" weight="medium">
          Earn
        </Typography>

        <div className="raft__savings__action">
          <Button variant="primary" size="large" onClick={() => null} disabled={false}>
            {transactionState === 'loading' && <Loading />}
            <Typography variant="button-label" color="text-primary-inverted">
              Deposit
            </Typography>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(Savings);
