import { memo } from 'react';
import backgroundImg from './background.png';

import './Background.scss';

const Background = () => (
  <div className="raft__background">
    <img src={backgroundImg} alt="" />
  </div>
);

export default memo(Background);
