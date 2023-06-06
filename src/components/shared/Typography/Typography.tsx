import { FC, memo } from 'react';
import {
  Typography as TypographyBase,
  TypographyBaseProps,
  TypographyType,
  TypographyTypeMap,
  TypographyVariantMap,
  TypographyColorMap,
  TypographyWeightMap,
} from 'tempus-ui';

export type TypographyVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'overline'
  | 'body'
  | 'body2'
  | 'caption'
  | 'input-value'
  | 'button-label';
export type TypographyColor =
  | 'text-primary'
  | 'text-secondary'
  | 'text-accent'
  | 'text-primary-inverted'
  | 'text-success'
  | 'text-warning'
  | 'text-warning-box'
  | 'text-error';
export type TypographyWeight = 'regular' | 'medium' | 'semi-bold' | 'bold';

const typographyVariantMap: TypographyVariantMap = {
  heading1: {
    fontStyle: 'normal',
    fontSize: '28px',
    lineHeight: '34px',
  },
  heading2: {
    fontStyle: 'normal',
    fontSize: '20px',
    lineHeight: '24px',
  },
  heading3: {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: '22.4px',
  },
  overline: {
    fontStyle: 'normal',
    fontSize: '12px',
    lineHeight: '16.8px',
  },
  body: {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: '22.4px',
  },
  body2: {
    fontStyle: 'normal',
    fontSize: '14px',
    lineHeight: '19.6px',
  },
  caption: {
    fontStyle: 'normal',
    fontSize: '12px',
    lineHeight: '16.8px',
  },
  'input-value': {
    fontStyle: 'normal',
    fontSize: '20px',
    lineHeight: '28px',
  },
  'button-label': {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: '22.4px',
  },
};

const typographyColorMap: TypographyColorMap = {
  'text-primary': 'var(--textPrimary)',
  'text-secondary': 'var(--textSecondary)',
  'text-accent': 'var(--textAccent)',
  'text-primary-inverted': 'var(--textPrimaryInverted)',
  'text-success': 'var(--textSuccess)',
  'text-warning': 'var(--textWarning)',
  'text-error': 'var(--textError)',
  'text-warning-box': 'var(--textWarningBox)',
};

const typographyWeightMap: TypographyWeightMap = {
  regular: 400,
  medium: 500,
  'semi-bold': 600,
  bold: 700,
};

const typographyDefaultWeightMap: { [x: string]: TypographyWeight } = {
  heading1: 'medium',
  heading2: 'medium',
  heading3: 'semi-bold',
  overline: 'semi-bold',
  body: 'regular',
  body2: 'regular',
  caption: 'regular',
  'input-value': 'bold',
  'button-label': 'medium',
};

const typographyTypeMap: TypographyTypeMap = {
  regular: 'Work Sans, sans-serif',
};

export type TypographyProps = TypographyBaseProps<TypographyVariant, TypographyColor, TypographyWeight, TypographyType>;

const Typography: FC<TypographyProps> = props => {
  const weight = props.weight ?? typographyDefaultWeightMap[props.variant] ?? 'regular';

  return (
    <TypographyBase<TypographyVariant, TypographyColor, TypographyWeight, TypographyType>
      {...props}
      weight={weight}
      variantMap={typographyVariantMap}
      colorMap={typographyColorMap}
      weightMap={typographyWeightMap}
      typeMap={typographyTypeMap}
    />
  );
};

export default memo(Typography) as FC<TypographyProps>;
