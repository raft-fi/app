import { memo, useMemo, useState } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { useAppLoaded } from '../../hooks';
import { Button, CurrencyInput, Icon, Loading, Tooltip, TooltipWrapper, Typography } from '../shared';
import LoadingSavings from '../LoadingSavings';

import './Savings.scss';

const Savings = () => {
  const appLoaded = useAppLoaded();

  const [transactionState] = useState<string>('default');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);

  const collateralLabelComponent = useMemo(
    () => (
      <>
        <ButtonWrapper
          className="raft__savings__input-deposit"
          selected={isAddCollateral}
          onClick={() => setIsAddCollateral(true)}
        >
          <Typography variant="overline" weight="semi-bold">
            DEPOSIT
          </Typography>
        </ButtonWrapper>
        <ButtonWrapper
          className="raft__savings__input-withdraw"
          selected={!isAddCollateral}
          onClick={() => setIsAddCollateral(false)}
        >
          <Typography variant="overline" weight="semi-bold">
            WITHDRAW
          </Typography>
        </ButtonWrapper>
      </>
    ),
    [isAddCollateral],
  );

  if (!appLoaded) {
    return (
      <div className="raft__savings__container">
        <LoadingSavings />
      </div>
    );
  }

  return (
    <div className="raft__savings__container">
      <div className="raft__savings__left">
        <div className="raft__savings">
          <Typography variant="heading2" weight="medium">
            Earn
          </Typography>

          <div className="raft__savings__input">
            <CurrencyInput
              label={collateralLabelComponent}
              precision={18}
              selectedToken={'R'}
              tokens={['R']}
              value={'0'}
              previewValue={''}
              onTokenUpdate={() => null}
              onValueUpdate={() => null}
              disabled={false}
              onBlur={() => null}
              error={false}
              errorMsg={undefined}
            />
          </div>

          <div className="raft__savings__extraData">
            <div className="raft__savings__extraDataTitle">
              <Typography variant="overline">TITLE</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__infoTooltip">
                    <Typography variant="body2">Activated charcoal paleo selvage synth hexagon.</Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>

            <Typography variant="overline">N/A</Typography>
          </div>

          <div className="raft__savings__extraData">
            <div className="raft__savings__extraDataTitle">
              <Typography variant="overline">TITLE 2</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__infoTooltip">
                    <Typography variant="body2">
                      Next level roof party bicycle rights same big mood, artisan VHS quinoa polaroid art party
                      mustache.
                    </Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>

            <Typography variant="overline">N/A</Typography>
          </div>

          <div className="raft__savings__action">
            <Button variant="primary" size="large" onClick={() => null} disabled={false}>
              {transactionState === 'loading' && <Loading />}
              <Typography variant="button-label" color="text-primary-inverted">
                Deposit
              </Typography>
            </Button>
          </div>
        </div>
      </div>
      <div className="raft__savings__right">
        <div className="raft__savings__stats">XX</div>
        <div className="raft__savings__faqs">FAQs</div>
      </div>
    </div>
  );
};

export default memo(Savings);
