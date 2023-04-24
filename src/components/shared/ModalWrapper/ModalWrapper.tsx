import React, { FC, PropsWithChildren, useEffect } from 'react';

import './ModalWrapper.scss';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Base modal that contains modal container and backdrop for closing the modal.
 * Pass children to populate the content of the modal.
 */
const ModalWrapper: FC<PropsWithChildren<ModalWrapperProps>> = ({ open, children, onClose }) => {
  const onBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    onClose();
  };

  /**
   * Add required class to body element to prevent scroll when modal is open
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollTop = document.documentElement.scrollTop;
    document.body.style.top = `-${scrollTop}px`;
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.scrollTop = scrollTop;
      document.body.style.removeProperty('top');
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div id="modal-backdrop" className="raft__modalWrapper__backdrop" onClick={onBackdropClick} />
      <div className="raft__modalWrapper__container">
        <div className="raft__modalWrapper">{children}</div>
      </div>
    </>
  );
};
export default ModalWrapper;
