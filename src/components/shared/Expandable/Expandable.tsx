import { FC, memo, PropsWithChildren } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import Icon from '../Icon';
import Typography from '../Typography';

import './Expandable.scss';

interface ExpandableProps {
  open: boolean;
  title: string;
  onToggle: () => void;
}

const Expandable: FC<PropsWithChildren<ExpandableProps>> = ({ open, title, onToggle, children }) => (
  <div className="raft__expandable">
    <ButtonWrapper className="raft__expandable__title" onClick={onToggle}>
      <Typography variant="body2" weight="medium">
        {title}
      </Typography>
      <Icon variant={open ? 'chevron-up' : 'chevron-down'} size="medium" />
    </ButtonWrapper>
    {open && <div className="raft__expandable__content">{children}</div>}
  </div>
);

export default memo(Expandable);
