import type { DamageRelationsByType } from '../weakness.js';

/** `damage_relations` dos 18 tipos, gravadas de GET /type/{name} em 2026-09-22 e traduzidas para o domínio. */
export const TYPE_RELATIONS: DamageRelationsByType = {
  normal: {
    doubleDamageFrom: ['fighting'],
    halfDamageFrom: [],
    noDamageFrom: ['ghost'],
  },
  fighting: {
    doubleDamageFrom: ['flying', 'psychic', 'fairy'],
    halfDamageFrom: ['rock', 'bug', 'dark'],
    noDamageFrom: [],
  },
  flying: {
    doubleDamageFrom: ['rock', 'electric', 'ice'],
    halfDamageFrom: ['fighting', 'bug', 'grass'],
    noDamageFrom: ['ground'],
  },
  poison: {
    doubleDamageFrom: ['ground', 'psychic'],
    halfDamageFrom: ['fighting', 'poison', 'bug', 'grass', 'fairy'],
    noDamageFrom: [],
  },
  ground: {
    doubleDamageFrom: ['water', 'grass', 'ice'],
    halfDamageFrom: ['poison', 'rock'],
    noDamageFrom: ['electric'],
  },
  rock: {
    doubleDamageFrom: ['fighting', 'ground', 'steel', 'water', 'grass'],
    halfDamageFrom: ['normal', 'flying', 'poison', 'fire'],
    noDamageFrom: [],
  },
  bug: {
    doubleDamageFrom: ['flying', 'rock', 'fire'],
    halfDamageFrom: ['fighting', 'ground', 'grass'],
    noDamageFrom: [],
  },
  ghost: {
    doubleDamageFrom: ['ghost', 'dark'],
    halfDamageFrom: ['poison', 'bug'],
    noDamageFrom: ['normal', 'fighting'],
  },
  steel: {
    doubleDamageFrom: ['fighting', 'ground', 'fire'],
    halfDamageFrom: [
      'normal',
      'flying',
      'rock',
      'bug',
      'steel',
      'grass',
      'psychic',
      'ice',
      'dragon',
      'fairy',
    ],
    noDamageFrom: ['poison'],
  },
  fire: {
    doubleDamageFrom: ['ground', 'rock', 'water'],
    halfDamageFrom: ['bug', 'steel', 'fire', 'grass', 'ice', 'fairy'],
    noDamageFrom: [],
  },
  water: {
    doubleDamageFrom: ['grass', 'electric'],
    halfDamageFrom: ['steel', 'fire', 'water', 'ice'],
    noDamageFrom: [],
  },
  grass: {
    doubleDamageFrom: ['flying', 'poison', 'bug', 'fire', 'ice'],
    halfDamageFrom: ['ground', 'water', 'grass', 'electric'],
    noDamageFrom: [],
  },
  electric: {
    doubleDamageFrom: ['ground'],
    halfDamageFrom: ['flying', 'steel', 'electric'],
    noDamageFrom: [],
  },
  psychic: {
    doubleDamageFrom: ['bug', 'ghost', 'dark'],
    halfDamageFrom: ['fighting', 'psychic'],
    noDamageFrom: [],
  },
  ice: {
    doubleDamageFrom: ['fighting', 'rock', 'steel', 'fire'],
    halfDamageFrom: ['ice'],
    noDamageFrom: [],
  },
  dragon: {
    doubleDamageFrom: ['ice', 'dragon', 'fairy'],
    halfDamageFrom: ['fire', 'water', 'grass', 'electric'],
    noDamageFrom: [],
  },
  dark: {
    doubleDamageFrom: ['fighting', 'bug', 'fairy'],
    halfDamageFrom: ['ghost', 'dark'],
    noDamageFrom: ['psychic'],
  },
  fairy: {
    doubleDamageFrom: ['poison', 'steel'],
    halfDamageFrom: ['fighting', 'bug', 'dark'],
    noDamageFrom: ['dragon'],
  },
};
