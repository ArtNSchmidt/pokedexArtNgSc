/**
 * Ícones da Figma como SVG inline (Material Symbols, outline). Sem biblioteca de ícones: são
 * dez desenhos, e uma dependência a mais só para isso contraria §7.7.
 */
import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  readonly title?: string | undefined;
};

const DEFAULT_SIZE = 24;

function Icon({ title, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={DEFAULT_SIZE}
      height={DEFAULT_SIZE}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title === undefined ? true : undefined}
      role={title === undefined ? undefined : 'img'}
      {...props}
    >
      {title === undefined ? null : <title>{title}</title>}
      {children}
    </svg>
  );
}

export function PokeballIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a10 10 0 0 1 9.95 9H15.9a4 4 0 0 0-7.8 0H2.05A10 10 0 0 1 12 2Zm0 20a10 10 0 0 1-9.95-9H8.1a4 4 0 0 0 7.8 0h6.05A10 10 0 0 1 12 22Zm0-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
    </Icon>
  );
}

export function TuneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 17v2h6v-2H3ZM3 5v2h10V5H3Zm10 16v-2h8v-2h-8v-2h-2v6h2ZM7 9v2H3v2h4v2h2V9H7Zm14 4v-2H11v2h10Zm-6-4h2V7h4V5h-4V3h-2v6Z" />
    </Icon>
  );
}

export function ArrowBackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2Z" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59Z" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6Z" />
    </Icon>
  );
}

export function WeightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a3 3 0 0 1 2.83 4H19a2 2 0 0 1 1.98 1.72l1 12A2 2 0 0 1 20 23H4a2 2 0 0 1-1.98-2.28l1-12A2 2 0 0 1 5 7h4.17A3 3 0 0 1 12 3Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM5 9l-1 12h16L19 9H5Z" />
    </Icon>
  );
}

export function StraightenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8Z" />
    </Icon>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23Z" />
    </Icon>
  );
}
