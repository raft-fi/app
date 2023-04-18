import { FC } from 'react';
import './LoadingPlaceholder.scss';

export type LoadingPlaceholderCircleSize = 'small' | 'medium';
export type LoadingPlaceholderWidth = 'tiny' | 'small' | 'medium' | 'large';
export type LoadingPlaceholderHeight = 'small' | 'medium';
export type LoadingPlaceholderShape =
  | { circle: LoadingPlaceholderCircleSize }
  | {
      width: LoadingPlaceholderWidth;
      height: LoadingPlaceholderHeight;
    };

export interface LoadingPlaceholderProps {
  shape: LoadingPlaceholderShape;
}

const LoadingPlaceholder: FC<LoadingPlaceholderProps> = props => {
  const { shape } = props;

  const shapeClasses =
    'circle' in shape
      ? `raft__loading-placeholder__circle-${shape.circle}`
      : `raft__loading-placeholder__width-${shape.width} raft__loading-placeholder__height-${shape.height}`;

  return (
    <div className={`raft__loading-placeholder ${shapeClasses}`}>
      <div className="raft__loading-placeholder__bar" />
    </div>
  );
};

export default LoadingPlaceholder;
