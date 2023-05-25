import { ChangeEvent, FC, ReactElement } from 'react';
import Icon from '../Icon';
import Typography, { TypographyVariant, TypographyWeight } from '../Typography';

import './Checkbox.scss';

export interface CheckboxProps {
  id: string;
  checked: boolean;
  label?: string | ReactElement;
  labelVariant?: TypographyVariant;
  labelWeight?: TypographyWeight;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox: FC<CheckboxProps> = props => {
  const { id, checked, label, labelVariant = 'body', labelWeight, onChange } = props;

  return (
    <span className="raft__checkbox">
      <span className="raft__checkbox__boxContainer" data-checked={checked}>
        <Icon variant="checkmark" size="tiny" />
        <input id={id} checked={checked} type="checkbox" onChange={onChange} />
      </span>
      {label && (
        <label htmlFor={id} className="raft__checkbox__label">
          <Typography variant={labelVariant} weight={labelWeight}>
            {label}
          </Typography>
        </label>
      )}
    </span>
  );
};

export default Checkbox;
