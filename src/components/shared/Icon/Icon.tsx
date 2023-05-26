import { FC, memo } from 'react';
import { Icon as IconBase, IconMap, IconProps } from 'tempus-ui';
import ArrowRight from './ArrowRight';
import Discord from './Discord';
import ExternalLink from './ExternalLink';
import Favorite from './Favorite';
import GitHub from './GitHub';
import LeftChevron from './LeftChevron';
import RightChevron from './RightChevron';
import DownChevron from './DownChevron';
import UpChevron from './UpChevron';
import Telegram from './Telegram';
import Twitter from './Twitter';
import Error from './Error';
import Success from './Success';
import ArrowDown from './ArrowDown';
import Globe from './Globe';
import Geoblock from './Geoblock';
import Profile from './Profile';
import Wallet from './Wallet';
import Close from './Close';
import Copy from './Copy';
import Info from './Info';
import TransactionFailed from './TransactionFailed';
import TransactionSuccess from './TransactionSuccess';
import PositionChanged from './PositionChanged';
import UnsupportedNetwork from './UnsupportedNetwork';
import ArrowRightThin from './ArrowRightThin';
import Checkmark from './Checkmark';
import ArrowUp from './ArrowUp';

type IconVariant =
  | 'discord'
  | 'telegram'
  | 'twitter'
  | 'github'
  | 'favorite'
  | 'error'
  | 'success'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'external-link'
  | 'arrow-right'
  | 'arrow-down'
  | 'arrow-up'
  | 'globe'
  | 'geoblock'
  | 'profile'
  | 'wallet'
  | 'close'
  | 'copy'
  | 'info'
  | 'transaction-failed'
  | 'transaction-success'
  | 'position-changed'
  | 'unsupported-network'
  | 'arrow-right-thin'
  | 'checkmark';

const ICON_MAP: IconMap = {
  discord: Discord,
  telegram: Telegram,
  twitter: Twitter,
  github: GitHub,
  favorite: Favorite,
  error: Error,
  success: Success,
  'chevron-left': LeftChevron,
  'chevron-right': RightChevron,
  'chevron-down': DownChevron,
  'chevron-up': UpChevron,
  'external-link': ExternalLink,
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  globe: Globe,
  geoblock: Geoblock,
  profile: Profile,
  wallet: Wallet,
  close: Close,
  copy: Copy,
  info: Info,
  'transaction-failed': TransactionFailed,
  'transaction-success': TransactionSuccess,
  'position-changed': PositionChanged,
  'unsupported-network': UnsupportedNetwork,
  'arrow-right-thin': ArrowRightThin,
  checkmark: Checkmark,
};

const Icon: FC<IconProps & { variant: IconVariant }> = props => <IconBase<IconVariant> {...props} iconMap={ICON_MAP} />;

export default memo(Icon);
