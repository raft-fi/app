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
  onValueChange: (value: number) => void;
}

const SliderInput: FC<SliderInputProps> = ({ label, value, min, max, step, onValueChange }) => {
  return (
    <div className="raft__sliderInput">
      <Typography variant="overline" weight="semi-bold" color="text-secondary">
        {label}
      </Typography>
      <div className="raft__sliderInputValue">
        <Typography variant="input-value" weight="bold">
          {value}x
        </Typography>
        <Slider value={value} min={min} max={max} step={step} onChange={onValueChange} />
      </div>
    </div>
  );
};
export default SliderInput;
