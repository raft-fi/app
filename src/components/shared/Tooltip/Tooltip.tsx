import { FC, PropsWithChildren } from 'react';

import './Tooltip.scss';

interface TooltipProps {
  className?: string;
}

const Tooltip: FC<PropsWithChildren<TooltipProps>> = ({ className = '', children }) => (
  <div className={`raft__tooltip ${className}`}>{children}</div>
);

export default Tooltip;
