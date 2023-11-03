import { memo } from 'react';

import './LoadingPage.scss';

const Input = () => (
  <div className="raft__loading-page__input">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__input-field" />
  </div>
);

const PositionAfter = () => (
  <div className="raft__loading-generate__position-after">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
  </div>
);

const GasFee = () => (
  <div className="raft__loading-generate__gas-fee">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value" />
  </div>
);

const Button = () => <div className="raft__loading-page__btn" />;

const Position = () => (
  <div className="raft__loading-generate__position">
    <div className="raft__loading-page__value" />
    <div className="raft__loading-generate__position-inputs">
      <Input />
      <Input />
    </div>
    <div className="raft__loading-generate__position-status">
      <PositionAfter />
      <div className="raft__loading-generate__position-status-gas">
        <GasFee />
        <GasFee />
      </div>
    </div>
    <Button />
  </div>
);

const StatRow = () => (
  <div className="raft__loading-generate__stat-row">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
    <div className="raft__loading-page__title" />
  </div>
);

const Stat = () => (
  <div className="raft__loading-generate__stat">
    <StatRow />
    <StatRow />
    <StatRow />
  </div>
);

const LoadingGenerate = () => (
  <div className="raft__loading-generate">
    <Stat />
    <Position />
  </div>
);

export default memo(LoadingGenerate);
