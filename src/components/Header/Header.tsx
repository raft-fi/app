import { memo, useMemo, useState } from 'react';
import { Header as HeaderBase } from 'tempus-ui';
import RaftLogo from '../Logo/RaftLogo';
import Wallet from '../Wallet';

import './Header.scss';

const Header = () => {
  const [, setMenuOpened] = useState(false);

  const logo = useMemo(() => <RaftLogo />, []);
  const navItems = useMemo(() => [<Wallet key="navitem-wallet" />], []);

  return (
    <div className="raft__header">
      <div className="raft__header__container">
        <HeaderBase logo={logo} navItems={navItems} menuItems={[]} menuOpened={false} setMenuOpened={setMenuOpened} />
      </div>
    </div>
  );
};

export default memo(Header);
