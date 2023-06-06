import { FC } from 'react';

import './Loading.scss';

export type LoadingColor = 'default' | 'primary' | 'secondary';

export interface LoadingProps {
  size?: number;
  color?: LoadingColor;
}

const DEFAULT_SIZE = 20;
const DEFAULT_COLOR: LoadingColor = 'default';

const Loading: FC<LoadingProps> = ({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }) => (
  <div className="raft__loading__container">
    <svg height={size} width={size} viewBox="0 0 100 100">
      <circle className={`raft__loading raft__loading__color-bg-${color}`} cx="50" cy="50" r="40" />
      <circle
        className={`raft__loading raft__loading__color-animate-${color} raft__loading__animate`}
        cx="50"
        cy="50"
        r="40"
      />
    </svg>
  </div>
);

export default Loading;
