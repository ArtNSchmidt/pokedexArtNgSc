import type { PokemonSummary } from '@pokedex/contracts';
import { Link } from 'react-router-dom';
import { paths } from '../../shared/routes';
import { formatPokedexNumber } from '../../shared/format';
import { Card } from '../../shared/ui';
import styles from './PokemonCard.module.css';

interface PokemonCardProps {
  readonly pokemon: PokemonSummary;
}

const IMAGE_SIZE = 72;

/** Card da Figma: número no canto, artwork de 72 px e nome sobre a faixa cinza na base. */
export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <Card as="li" className={styles.card}>
      <Link to={paths.detail(pokemon.id)} className={styles.link}>
        <span className={styles.number}>{formatPokedexNumber(pokemon.id)}</span>
        <img
          className={styles.image}
          src={pokemon.artworkUrl ?? pokemon.spriteUrl}
          alt=""
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          loading="lazy"
          decoding="async"
        />
        <span className={styles.name}>{pokemon.displayName}</span>
        <span className={styles.band} aria-hidden="true" />
      </Link>
    </Card>
  );
}
