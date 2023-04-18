import { FC } from 'react';
import LoadingPlaceholder, { LoadingPlaceholderHeight, LoadingPlaceholderWidth } from '../LoadingPlaceholder';

import './LoadingButtonPlaceholder.scss';

interface LoadingButtonPlaceholderProps {
  width?: LoadingPlaceholderWidth;
  height?: LoadingPlaceholderHeight;
}

const LoadingButtonPlaceholder: FC<LoadingButtonPlaceholderProps> = props => {
  const { width = 'medium', height = 'small' } = props;

  return (
    <div className="raft__loading-button-placeholder">
      <LoadingPlaceholder shape={{ width, height }} />
    </div>
  );
};

export default LoadingButtonPlaceholder;
