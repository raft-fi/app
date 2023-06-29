import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '../../shared';

import './PositionPickerItem.scss';

interface PositionPickerItemProps {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
}

const PositionPickerItem: FC<PositionPickerItemProps> = ({ title, description, icon, path }) => {
  return (
    <Link to={path} className="raft__positionPickerItem">
      <div className="raft__positionPickerItemIcon">{icon}</div>
      <Typography className="raft__positionPickerItemTitle" variant="body2" weight="medium">
        {title}
      </Typography>
      <Typography variant="caption" color="text-secondary">
        {description}
      </Typography>
    </Link>
  );
};
export default PositionPickerItem;
