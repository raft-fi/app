import { FC, PropsWithChildren, useCallback } from 'react';
import { ButtonWrapper, ButtonWrapperProps } from 'tempus-ui';

import './Button.scss';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

type ButtonProps = ButtonWrapperProps & {
  className?: string;
  variant: ButtonVariant;
  disabled?: boolean;
  onClick: () => void;
};

const getButtonClass = (variant: ButtonVariant): string => `raft__button-${variant}`;

const Button: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  className = '',
  variant,
  disabled,
  selected,
  onClick,
}) => {
  // TODO - It seems that ButtonWrapper is clickable even if we pass in disabled, this is a workaround fix
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [disabled, onClick]);

  return (
    <ButtonWrapper
      className={`raft__button ${getButtonClass(variant)} ${className}`}
      disabled={disabled}
      selected={selected}
      onClick={handleClick}
    >
      {children}
    </ButtonWrapper>
  );
};

export default Button;
