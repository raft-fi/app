import { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import { ButtonWrapper, ButtonWrapperProps } from '@tempusfinance/common-ui';
import Icon from '../Icon';
import Typography from '../Typography';

import './Button.scss';

type ButtonVariant = 'primary' | 'secondary' | 'error';
type ButtonSize = 'medium' | 'large';

const ICON_SIZE_MAP = {
  medium: 16,
  large: 20,
};

interface ButtonProps extends Omit<ButtonWrapperProps, 'size'> {
  className?: string;
  variant: ButtonVariant;
  size?: ButtonSize;
  text?: string;
  disabled?: boolean;
  onClick: () => void;
}

const Button: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  className = '',
  variant,
  size = 'medium',
  text,
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

  const buttonClasses = useMemo(
    () => `raft__button-${variant} raft__button-size-${size} ${className}`,
    [className, size, variant],
  );

  const textComponent = useMemo(() => {
    if (!text) {
      return null;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        return (
          <Typography variant="button-label" color={`text-${variant}`}>
            {text}
          </Typography>
        );
      case 'error':
        return (
          <Typography className="raft__button-text" variant="button-label" color="text-error">
            <Icon variant="error" size={ICON_SIZE_MAP[size]} />
            {text}
          </Typography>
        );
      default:
        return null;
    }
  }, [size, text, variant]);

  return (
    <ButtonWrapper
      className={`raft__button ${buttonClasses}`}
      disabled={disabled}
      selected={selected}
      onClick={handleClick}
    >
      {textComponent ?? children}
    </ButtonWrapper>
  );
};

export default Button;
