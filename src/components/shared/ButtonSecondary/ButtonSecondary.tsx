import { FC, PropsWithChildren } from 'react';
import { ButtonWrapper } from 'tempus-ui';

import './ButtonSecondary.scss';

interface ButtonSecondaryProps {
  onClick: () => void;
}

const ButtonSecondary: FC<PropsWithChildren<ButtonSecondaryProps>> = ({ children, onClick }) => {
  return (
    <ButtonWrapper className="raft__buttonSecondary" onClick={onClick}>
      {children}
    </ButtonWrapper>
  );
};
export default ButtonSecondary;
