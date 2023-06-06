import { FC, PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import './TooltipWrapper.scss';

export type OpenEvent = 'click';
export type TooltipPlacement = 'left' | 'right' | 'top' | 'bottom' | 'bottom-start' | 'bottom-end';

export interface TooltipWrapperProps {
  anchorClasses?: string;
  tooltipContent: ReactNode;
  placement: TooltipPlacement;
  openEvent?: OpenEvent;
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const TooltipWrapper: FC<PropsWithChildren<TooltipWrapperProps>> = props => {
  const { anchorClasses = '', tooltipContent, placement, disabled = false, onOpen, onClose, children } = props;

  const [open, setOpen] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);
  const toggleOpen = useCallback(
    () =>
      setOpen(prev => {
        (open ? onClose : onOpen)?.();
        return !prev;
      }),
    [onClose, onOpen, open],
  );

  if (disabled) {
    return <>{children}</>;
  }

  const anchorClassName = `raft__tooltip-wrapper-anchor ${anchorClasses}`;

  if (!tooltipContent) {
    return (
      <div tabIndex={0} className={anchorClassName} data-testid="tooltip-anchor">
        {children}
      </div>
    );
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        <Tooltip
          title={tooltipContent}
          placement={placement}
          arrow
          classes={{ tooltip: 'raft__tooltip-content' }}
          open={open}
          onClose={handleClose}
          disableFocusListener
          disableHoverListener
          disableTouchListener
        >
          <div tabIndex={0} className={anchorClassName} data-testid="tooltip-anchor" onClick={toggleOpen}>
            {children}
          </div>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
};

export default TooltipWrapper;
