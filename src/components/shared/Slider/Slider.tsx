import { ChangeEvent, FC, useCallback } from 'react';

import './Slider.scss';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  step: number;
  onChange: (value: number) => void;
}

const Slider: FC<SliderProps> = ({ min, max, value, step, onChange }) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(event.target.value));
    },
    [onChange],
  );

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      step={step}
      className="raft__slider"
      onChange={handleChange}
    ></input>
  );
};
export default Slider;
