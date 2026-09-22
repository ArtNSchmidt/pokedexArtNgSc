import { ChevronRightIcon } from './icons';
import styles from './Select.module.css';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
}

/** `<select>` nativo (melhor teclado e toque no celular) com o visual de campo da Figma. */
export function Select({ id, label, value, placeholder, options, onChange }: SelectProps) {
  return (
    <div className={styles.select}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <select
          id={id}
          className={styles.control}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRightIcon className={styles.chevron} />
      </div>
    </div>
  );
}
