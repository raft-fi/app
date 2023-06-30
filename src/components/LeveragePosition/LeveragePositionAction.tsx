import { useCallback } from 'react';
import { Button, Loading, Typography } from '../shared';

import './LeveragePositionAction.scss';

const LeveragePositionAction = () => {
  const buttonDisabled = false;
  const buttonLabel = 'Execute';

  const onClick = useCallback(() => {
    // TODO - Add position action
  }, []);

  return (
    <div className="raft__leveragePositionAction">
      <Button variant="primary" size="large" onClick={onClick} disabled={buttonDisabled}>
        {false && <Loading />}
        <Typography variant="button-label" color="text-primary-inverted">
          {buttonLabel}
        </Typography>
      </Button>
    </div>
  );
};
export default LeveragePositionAction;
