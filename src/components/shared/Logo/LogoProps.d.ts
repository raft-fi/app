export default interface LogoProps {
  size?: 'x-large' | 'large' | 'medium' | 'small' | number;
}

export interface InnerLogoProps extends Required<LogoProps> {}
