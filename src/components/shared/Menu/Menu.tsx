import { FC, PropsWithChildren } from 'react';

import './Menu.scss';

interface MenuProps {
  open: boolean;
  onClose: () => void;
}

const Menu: FC<PropsWithChildren<MenuProps>> = ({ open, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <div id="menu-backdrop" className="raft__menu__backdrop" onClick={onClose} />
      <div className="raft__menu">{children}</div>
    </>
  );
};
export default Menu;
