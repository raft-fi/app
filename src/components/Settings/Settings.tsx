import { SwapRouter } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { memo, useCallback, useMemo, useState } from 'react';
import { DEFAULT_SLIPPAGE } from '../../constants';
import { useSettingOptions } from '../../hooks';
import { formatPercentage } from '../../utils';
import { BaseInput, Button, Icon, Typography } from '../shared';

import './Settings.scss';

const SLIPPAGE_OPTIONS = [new Decimal(0.0025), new Decimal(DEFAULT_SLIPPAGE), new Decimal(0.01)];
const ROUTER_OPTIONS: Record<SwapRouter, string> = {
  '1inch': '1inch',
};

const Settings = () => {
  const [{ router, slippage }, setPartialOption] = useSettingOptions();
  const [open, setOpen] = useState<boolean>(false);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [isCustomSlippageFocused, setIsCustomSlippageFocused] = useState<boolean>(false);

  const isCustomSlippageSelected = useMemo(
    () => isCustomSlippageFocused || (customSlippage && !SLIPPAGE_OPTIONS.some(s => s.equals(slippage))),
    [customSlippage, isCustomSlippageFocused, slippage],
  );

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const onRouterSelected = useCallback(
    (selected: SwapRouter) => {
      if (selected !== router) {
        setPartialOption({ router: selected });
      }
    },
    [router, setPartialOption],
  );
  const onSlippageSelected = useCallback(
    (selected: Decimal) => {
      if (!selected.equals(slippage)) {
        setPartialOption({ slippage: selected });
      }
    },
    [setPartialOption, slippage],
  );
  const onCustomSlippageChange = useCallback(
    (value: string) => {
      setCustomSlippage(value);
      try {
        setPartialOption({ slippage: value ? new Decimal(value).div(100) : new Decimal(DEFAULT_SLIPPAGE) });
      } catch (error) {
        // parse error for input
      }
    },
    [setPartialOption],
  );
  const onCustomSlippageFocus = useCallback(() => setIsCustomSlippageFocused(true), []);
  const onCustomSlippageBlur = useCallback(() => setIsCustomSlippageFocused(false), []);

  return (
    <div className="raft__settings">
      <Button variant="secondary" onClick={onOpen}>
        <Icon variant="settings" size={16} />
      </Button>
      {open && (
        <>
          <div id="setting-backdrop" className="raft__settings__backdrop" onClick={onClose} />
          <div className="raft__settings__popup">
            <div className="raft__settings__popup__router">
              <Typography variant="overline" weight="semi-bold">
                ROUTER
              </Typography>
              <div className="raft__settings__popup__options">
                {Object.entries(ROUTER_OPTIONS).map(([r, label]) => (
                  <Button
                    key={`router-${router}`}
                    variant={router === r ? 'primary' : 'secondary'}
                    onClick={() => onRouterSelected(r as SwapRouter)}
                    text={label}
                  />
                ))}
              </div>
            </div>
            <div className="raft__settings__popup__slippage">
              <Typography variant="overline" weight="semi-bold">
                SLIPPAGE
              </Typography>
              <div className="raft__settings__popup__options">
                {SLIPPAGE_OPTIONS.map(s => (
                  <Button
                    key={`slippage-${s.toString()}`}
                    variant={!isCustomSlippageSelected && slippage.equals(s) ? 'primary' : 'secondary'}
                    onClick={() => onSlippageSelected(s)}
                    text={formatPercentage(s, { pad: false }) as string}
                  />
                ))}
                <Typography
                  className={`raft__settings__popup__slippage__custom ${isCustomSlippageSelected ? 'selected' : ''}`}
                  variant="overline"
                  weight="medium"
                  color={isCustomSlippageSelected ? 'text-primary-inverted' : 'text-primary'}
                >
                  <BaseInput
                    value={customSlippage}
                    placeholder={isCustomSlippageSelected ? undefined : 'Custom'}
                    pattern="[0-9]{0,3}([.][0-9]{0,4})?"
                    onChange={onCustomSlippageChange}
                    onFocus={onCustomSlippageFocus}
                    onBlur={onCustomSlippageBlur}
                  />
                  {customSlippage || isCustomSlippageSelected ? '%' : ''}
                </Typography>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(Settings);
