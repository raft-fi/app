import { FC, memo, useMemo } from 'react';
import { TokenLogo } from '@tempusfinance/common-ui';
import { R_TOKEN, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { formatCurrency } from '../../../../utils';
import { SavingsStatMap } from '../../../../hooks';
import { NETWORK_NAMES, SUPPORTED_SAVINGS_NETWORKS } from '../../../../networks';
import { R_TOKEN_UI_PRECISION } from '../../../../constants';
import { Tooltip, Typography, ValueLabel } from '../../../shared';

import './SavingsStatBreakdownTooltip.scss';

type SavingsStatBreakdownTooltipProps = {
  stats: SavingsStatMap;
  field: string;
};

const SavingsStatBreakdownTooltip: FC<SavingsStatBreakdownTooltipProps> = ({ stats, field }) => {
  const savingsTvlMapFormatted = useMemo(
    () =>
      SUPPORTED_SAVINGS_NETWORKS.reduce(
        (map, network) => ({
          ...map,
          [network]:
            formatCurrency(stats[network][field], {
              fractionDigits: R_TOKEN_UI_PRECISION,
              currency: R_TOKEN,
            }) ?? '---',
        }),
        {} as { [key in SupportedSavingsNetwork]: string },
      ),
    [field, stats],
  );

  return (
    <Tooltip className="raft__savingsStatBreakdownTooltip">
      <ul>
        {SUPPORTED_SAVINGS_NETWORKS.map(network => {
          const networkName = NETWORK_NAMES[network];

          return (
            <li key={`savings-tvl-breakdown-${networkName}`}>
              <TokenLogo type={`network-${network}`} size="small" />
              <Typography className="raft__savingsStatBreakdownTooltip__networkName" variant="body2">
                {networkName}
              </Typography>
              <div className="raft__savingsStatBreakdownTooltip__networkTvlValue">
                <ValueLabel value={savingsTvlMapFormatted[network]} />
              </div>
            </li>
          );
        })}
      </ul>
    </Tooltip>
  );
};

export default memo(SavingsStatBreakdownTooltip);
