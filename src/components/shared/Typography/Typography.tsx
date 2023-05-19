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
  | 'legal-page-title'
  | 'hero-subtitle'
  | 'header'
  | 'section-header'
  | 'subheader'
  | 'title'
  | 'subtitle'
  | 'body-primary'
  | 'body-secondary'
  | 'body-tertiary';
export type TypographyColor =
  | 'text-primary'
  | 'text-secondary'
  | 'text-accent'
  | 'text-primary-inverted'
  | 'text-success'
  | 'text-warning'
  | 'text-error';
export type TypographyWeight = 'regular' | 'medium' | 'semi-bold' | 'bold';

const typographyVariantMap: TypographyVariantMap = {
  'legal-page-title': {
    fontStyle: 'normal',
    fontSize: '64px',
    lineHeight: '70px',
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

const typographyColorMap: TypographyColorMap = {
  'text-primary': 'var(--textPrimary)',
  'text-secondary': 'var(--textSecondary)',
  'text-accent': 'var(--textAccent)',
  'text-primary-inverted': 'var(--textPrimaryInverted)',
  'text-success': 'var(--textSuccess)',
  'text-warning': 'var(--textWarning)',
  'text-error': 'var(--textError)',
};

const typographyWeightMap: TypographyWeightMap = {
  regular: 400,
  medium: 500,
  'semi-bold': 600,
  bold: 700,
};

const typographyTypeMap: TypographyTypeMap = {
  regular: 'Work Sans, sans-serif',
  mono: 'BioRhyme, serif',
};

export type TypographyProps = TypographyBaseProps<TypographyVariant, TypographyColor, TypographyWeight, TypographyType>;

const Typography: FC<TypographyProps> = props => (
  <TypographyBase<TypographyVariant, TypographyColor, TypographyWeight, TypographyType>
    {...props}
    variantMap={typographyVariantMap}
    colorMap={typographyColorMap}
    weightMap={typographyWeightMap}
    typeMap={typographyTypeMap}
  />
);

export default memo(Typography) as FC<TypographyProps>;
