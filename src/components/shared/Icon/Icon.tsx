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
import { TransactionFailedIcon } from './TransactionFailed';

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
  | 'globe'
  | 'geoblock'
  | 'profile'
  | 'wallet'
  | 'close'
  | 'copy'
  | 'transaction-failed';

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
  globe: Globe,
  geoblock: Geoblock,
  profile: Profile,
  wallet: Wallet,
  close: Close,
  copy: Copy,
  'transaction-failed': TransactionFailedIcon,
};

const Icon: FC<IconProps & { variant: IconVariant }> = props => <IconBase<IconVariant> {...props} iconMap={ICON_MAP} />;

export default memo(Icon);
