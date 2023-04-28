import { FC, PropsWithChildren } from 'react';
import { ButtonWrapper, ButtonWrapperProps } from 'tempus-ui';

import './Button.scss';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

type ButtonProps = ButtonWrapperProps & {
  variant: ButtonVariant;
  disabled?: boolean;
  onClick: () => void;
};

const getButtonClass = (variant: ButtonVariant): string => `raft__button-${variant}`;

const Button: FC<PropsWithChildren<ButtonProps>> = ({ children, variant, disabled, selected, onClick }) => {
  return (
    <ButtonWrapper
      className={`raft__button ${getButtonClass(variant)}`}
      disabled={disabled}
      selected={selected}
      onClick={onClick}
    >
      {children}
    </ButtonWrapper>
  );
};

export default Button;
