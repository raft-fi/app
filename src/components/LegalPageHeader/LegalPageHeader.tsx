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
      <Typography className="raft__legalPageHeader__title" variant="legal-page-title" weight="medium">
        {title}
      </Typography>
      <Typography className="raft__legalPageHeader__subtitle" variant="subheader">
        {subtitle}
      </Typography>
    </div>
  );
};
export default LegalPageHeader;
