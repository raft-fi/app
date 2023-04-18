import { FC } from 'react';
import LoadingPlaceholder from '../LoadingPlaceholder';

import './LoadingToggleSwitchPlaceholder.scss';

const LoadingToggleSwitchPlaceholder: FC = () => {
  return (
    <div className="raft__loading-toggle-switch-placeholder">
      <div className="raft__loading-toggle-switch-placeholder__body" />
      <LoadingPlaceholder shape={{ circle: 'small' }} />
    </div>
  );
};

export default LoadingToggleSwitchPlaceholder;
