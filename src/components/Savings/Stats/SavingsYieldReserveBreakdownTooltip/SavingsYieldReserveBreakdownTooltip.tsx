import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { formatCurrency } from '../../../../utils';
import { useSavingsYieldReserves } from '../../../../hooks';
import { NETWORK_NAMES, SAVINGS_MAINNET_NETWORKS, SAVINGS_TESTNET_NETWORKS } from '../../../../networks';
import { R_TOKEN_UI_PRECISION } from '../../../../constants';
import { Tooltip, Typography, ValueLabel } from '../../../shared';

import './SavingsYieldReserveBreakdownTooltip.scss';

const SavingsYieldReserveBreakdownTooltip = () => {
  const savingsYieldReserves = useSavingsYieldReserves();

  const networksToShow = useMemo(() => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }
    return networks;
  }, []);

  const savingsYieldReserveMapFormatted = useMemo(
    () =>
      networksToShow.reduce(
        (map, network) => ({
          ...map,
          [network]:
            formatCurrency(savingsYieldReserves[network], {
              fractionDigits: R_TOKEN_UI_PRECISION,
              currency: R_TOKEN,
            }) ?? '---',
        }),
        {} as { [key in SupportedSavingsNetwork]: string },
      ),
    [networksToShow, savingsYieldReserves],
  );

  return (
    <Tooltip className="raft__savingsYieldReserveBreakdownTooltip">
      <ul>
        {networksToShow.map(network => {
          const networkName = NETWORK_NAMES[network];

          return (
            <li key={`savings-yieldReserve-breakdown-${networkName}`}>
              <TokenLogo type={`network-${network}`} size="small" />
              <Typography className="raft__savingsYieldReserveBreakdownTooltip__networkName" variant="body2">
                {networkName}
              </Typography>
              <div className="raft__savingsYieldReserveBreakdownTooltip__networkYieldReserveValue">
                <ValueLabel value={savingsYieldReserveMapFormatted[network]} />
              </div>
            </li>
          );
        })}
      </ul>
    </Tooltip>
  );
};

export default memo(SavingsYieldReserveBreakdownTooltip);
