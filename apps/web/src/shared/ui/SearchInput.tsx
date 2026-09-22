import { useId } from 'react';
import { CloseIcon, SearchIcon } from './icons';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

/** Pílula branca de busca da Figma (32 px, raio 16): lupa, campo e botão de limpar quando há texto. */
export function SearchInput({ value, onChange, label, placeholder, maxLength }: SearchInputProps) {
  const id = useId();
  const hasValue = value.length > 0;

  return (
    <div className={styles.wrapper}>
      <SearchIcon className={styles.icon} />
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {hasValue ? (
        <button
          type="button"
          className={styles.clear}
          aria-label="Limpar busca"
          onClick={() => {
            onChange('');
          }}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}
