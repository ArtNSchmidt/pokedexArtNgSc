import {
  generationNameSchema,
  typeNameSchema,
  type GenerationName,
  type TypeName,
} from '@pokedex/contracts';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { generationsQuery, typesQuery } from '../../shared/api/queries';
import { Button, Popover, Select, TuneIcon } from '../../shared/ui';
import styles from './PokemonFilters.module.css';

interface PokemonFiltersProps {
  readonly type: TypeName | '';
  readonly generation: GenerationName | '';
  readonly activeCount: number;
  readonly onTypeChange: (type: TypeName | '') => void;
  readonly onGenerationChange: (generation: GenerationName | '') => void;
  readonly onClear: () => void;
}

/**
 * Botão redondo da Figma (no lugar do "Sort by", ADR-007) que abre o popup vermelho com os dois
 * filtros. As opções vêm de `GET /types` e `GET /generations` (endpoints 3 e 6 em uso).
 */
export function PokemonFilters({
  type,
  generation,
  activeCount,
  onTypeChange,
  onGenerationChange,
  onClear,
}: PokemonFiltersProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const types = useQuery(typesQuery);
  const generations = useQuery(generationsQuery);

  const typeOptions = (types.data ?? []).map((option) => ({
    value: option.name,
    label: option.displayName,
  }));
  const generationOptions = (generations.data ?? []).map((option) => ({
    value: option.name,
    label: `${option.displayName} · ${option.region}`,
  }));

  return (
    <div className={styles.anchor}>
      <Button
        ref={trigger}
        variant="icon"
        aria-label={activeCount > 0 ? `Filtros (${String(activeCount)} ativos)` : 'Filtros'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <TuneIcon />
        {activeCount > 0 ? <span className={styles.dot} aria-hidden="true" /> : null}
      </Button>

      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        label="Filtros"
        triggerRef={trigger}
      >
        <Select
          id="filter-type"
          label="Tipo"
          value={type}
          placeholder={types.isError ? 'Tipos indisponíveis' : 'Todos os tipos'}
          options={typeOptions}
          onChange={(value) => {
            onTypeChange(toTypeName(value));
          }}
        />
        <Select
          id="filter-generation"
          label="Geração"
          value={generation}
          placeholder={generations.isError ? 'Gerações indisponíveis' : 'Todas as gerações'}
          options={generationOptions}
          onChange={(value) => {
            onGenerationChange(toGenerationName(value));
          }}
        />
        <Button variant="ghost" disabled={activeCount === 0} onClick={onClear}>
          Limpar filtros
        </Button>
      </Popover>
    </div>
  );
}

function toTypeName(value: string): TypeName | '' {
  const parsed = typeNameSchema.safeParse(value);
  return parsed.success ? parsed.data : '';
}

function toGenerationName(value: string): GenerationName | '' {
  const parsed = generationNameSchema.safeParse(value);
  return parsed.success ? parsed.data : '';
}
