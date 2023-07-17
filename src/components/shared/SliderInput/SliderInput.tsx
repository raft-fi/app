import { FC } from 'react';
import Slider from '../Slider';
import Typography from '../Typography';

import './SliderInput.scss';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onValueChange: (value: number) => void;
}

const SliderInput: FC<SliderInputProps> = ({ label, value, min, max, step, disabled = false, onValueChange }) => {
  return (
    <div className={`raft__sliderInput ${disabled ? ' raft__sliderInputDisabled' : ''}`}>
      <Typography variant="overline" weight="semi-bold" color="text-secondary">
        {label}
      </Typography>
      <div className="raft__sliderInputValue">
        <Typography variant="input-value" weight="bold">
          {value}x
        </Typography>
        <Slider value={value} min={min} max={max} step={step} onChange={onValueChange} />
      </div>
      {disabled && <div className="raft__currencyInput__disabledOverlay" />}
    </div>
  );
};
export default SliderInput;
