import { FC } from 'react';
import { Typography } from '../shared';

import './LegalPageHeader.scss';

interface LegalPageHeaderProps {
  title: string;
  subtitle: string;
}

const LegalPageHeader: FC<LegalPageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="raft__legalPageHeader">
      <Typography className="raft__legalPageHeader__title" variant="heading1" weight="bold">
        {title}
      </Typography>
      <Typography className="raft__legalPageHeader__subtitle" variant="heading2">
        {subtitle}
      </Typography>
    </div>
  );
};
export default LegalPageHeader;
