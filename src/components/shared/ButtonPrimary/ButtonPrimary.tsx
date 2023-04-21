import { FC } from 'react';
import { ButtonWrapper } from 'tempus-ui';

import './ButtonPrimary.scss';

interface ButtonPrimaryProps {
  onClick: () => void;
}

const ButtonPrimary: FC<ButtonPrimaryProps> = ({ children, onClick }) => {
  return (
    <ButtonWrapper className="raft__buttonPrimary" onClick={onClick}>
      {children}
    </ButtonWrapper>
  );
};
export default ButtonPrimary;
