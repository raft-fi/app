import { FC, PropsWithChildren } from 'react';
import { ButtonWrapper } from 'tempus-ui';

import './ButtonTertiary.scss';

interface ButtonTertiaryProps {
  onClick: () => void;
}

const ButtonTertiary: FC<PropsWithChildren<ButtonTertiaryProps>> = ({ children, onClick }) => {
  return (
    <ButtonWrapper className="raft__buttonTertiary" onClick={onClick}>
      {children}
    </ButtonWrapper>
  );
};
export default ButtonTertiary;
