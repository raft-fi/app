import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { formatCurrency } from '../../../../utils';
import { useSavingsTvl } from '../../../../hooks';
import { NETWORK_NAMES, SAVINGS_MAINNET_NETWORKS, SAVINGS_TESTNET_NETWORKS } from '../../../../networks';
import { R_TOKEN_UI_PRECISION } from '../../../../constants';
import { Tooltip, Typography, ValueLabel } from '../../../shared';

import './SavingsTvlBreakdownTooltip.scss';

const SavingsTvlBreakdownTooltip = () => {
  const savingsTvl = useSavingsTvl();

  const networksToShow = useMemo(() => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }
    return networks;
  }, []);

  const savingsTvlMapFormatted = useMemo(
    () =>
      networksToShow.reduce(
        (map, network) => ({
          ...map,
          [network]: formatCurrency(savingsTvl[network], {
            fractionDigits: R_TOKEN_UI_PRECISION,
            currency: R_TOKEN,
          }),
        }),
        {} as { [key in SupportedSavingsNetwork]: string },
      ),
    [networksToShow, savingsTvl],
  );

  return (
    <Tooltip className="raft__savingsTvlBreakdownTooltip">
      <ul>
        {networksToShow.map(network => {
          const networkName = NETWORK_NAMES[network];

          return (
            <li key={`savings-tvl-breakdown-${networkName}`}>
              <TokenLogo type={`network-${network}`} size="small" />
              <Typography className="raft__savingsTvlBreakdownTooltip__networkName" variant="body2">
                {networkName}
              </Typography>
              <div className="raft__savingsTvlBreakdownTooltip__networkTvlValue">
                <ValueLabel value={savingsTvlMapFormatted[network]} />
              </div>
            </li>
          );
        })}
      </ul>
    </Tooltip>
  );
};

export default memo(SavingsTvlBreakdownTooltip);
