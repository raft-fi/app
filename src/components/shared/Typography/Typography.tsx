import { FC, memo } from 'react';
import {
  Typography as TypographyBase,
  TypographyColor,
  TypographyBaseProps,
  TypographyType,
  TypographyTypeMap,
  TypographyVariantMap,
  TypographyWeightMap,
} from 'tempus-ui';

export type TypographyVariant =
  | 'hero-title'
  | 'hero-subtitle'
  | 'header'
  | 'section-header'
  | 'subheader'
  | 'title'
  | 'subtitle'
  | 'body-primary'
  | 'body-secondary'
  | 'body-tertiary';
export type TypographyWeight = 'regular' | 'medium' | 'semi-bold' | 'bold';

const typographyVariantMap: TypographyVariantMap = {
  'hero-title': {
    fontStyle: 'normal',
    fontSize: '106px',
    lineHeight: '53px',
  },
  'hero-subtitle': {
    fontStyle: 'normal',
    fontSize: '48px',
    lineHeight: '24px',
  },
  header: {
    fontStyle: 'normal',
    fontSize: '40px',
    lineHeight: '48px',
  },
  'section-header': {
    fontStyle: 'normal',
    fontSize: '36px',
    lineHeight: '44px',
  },
  subheader: {
    fontStyle: 'normal',
    fontSize: '32px',
    lineHeight: '40px',
  },
  title: {
    fontStyle: 'normal',
    fontSize: '24px',
    lineHeight: '32px',
  },
  subtitle: {
    fontStyle: 'normal',
    fontSize: '20px',
    lineHeight: '28px',
  },
  'body-primary': {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: '18px',
  },
  'body-secondary': {
    fontStyle: 'normal',
    fontSize: '14px',
    lineHeight: '16px',
  },
  'body-tertiary': {
    fontStyle: 'normal',
    fontSize: '12px',
    lineHeight: '16px',
  },
};

const typographyWeightMap: TypographyWeightMap = {
  regular: 400,
  medium: 500,
  'semi-bold': 600,
  bold: 700,
};

const typographyTypeMap: TypographyTypeMap = {
  regular: 'Work Sans, sans-serif',
};

export interface TypographyProps
  extends TypographyBaseProps<TypographyVariant, TypographyColor, TypographyWeight, TypographyType> {}

const Typography: FC<TypographyProps> = props => (
  <TypographyBase<TypographyVariant, TypographyColor, TypographyWeight, TypographyType>
    {...props}
    variantMap={typographyVariantMap}
    weightMap={typographyWeightMap}
    typeMap={typographyTypeMap}
  />
);

export default memo(Typography) as FC<TypographyProps>;
