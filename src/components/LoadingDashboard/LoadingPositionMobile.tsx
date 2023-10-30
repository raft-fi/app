import { memo } from 'react';

const Input = () => (
  <div className="raft__loading-position-mobile__input">
    <div className="raft__loading-mobile__title" />
    <div className="raft__loading-position-mobile__input-field" />
  </div>
);

const PositionAfter = () => (
  <div className="raft__loading-position-mobile__position-after">
    <div className="raft__loading-mobile__title" />
    <div className="raft__loading-mobile__value">
      <div className="raft__loading-mobile__value-icon" />
      <div className="raft__loading-mobile__value-number" />
    </div>
    <div className="raft__loading-mobile__value">
      <div className="raft__loading-mobile__value-icon" />
      <div className="raft__loading-mobile__value-number" />
    </div>
    <div className="raft__loading-mobile__value">
      <div className="raft__loading-mobile__value-icon" />
      <div className="raft__loading-mobile__value-number" />
    </div>
  </div>
);

const GasFee = () => (
  <div className="raft__loading-position-mobile__gas-fee">
    <div className="raft__loading-mobile__title" />
    <div className="raft__loading-mobile__value-number" />
  </div>
);

const Button = () => <div className="raft__loading-position-mobile__btn" />;

const LoadingPositionMobile = () => (
  <div className="raft__loading-position-mobile">
    <div className="raft__loading-mobile__value-number" />
    <Input />
    <Input />
    <PositionAfter />
    <GasFee />
    <GasFee />
    <Button />
  </div>
);

export default memo(LoadingPositionMobile);
