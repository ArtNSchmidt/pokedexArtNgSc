import {
  POKEDEX_LAST_ID,
  TYPE_NAMES,
  type EvolutionStage,
  type GenerationName,
  type GenerationOption,
  type ListQuery,
  type PokemonDetail,
  type PokemonListPage,
  type PokemonSummary,
  type TypeName,
  type TypeOption,
} from '@pokedex/contracts';
import {
  listEvolutionSpecies,
  paginate,
  PokemonNotFoundError,
  type DamageRelationsByType,
  type PokemonRepository,
} from '@pokedex/domain';
import type { RepositoryCaches } from '../cache/repositoryCaches.js';
import type { JsonHttpClient } from '../http/pokeApiClient.js';
import {
  toEvolutionChainNode,
  toGenerationOptions,
  toPokedexIds,
  toPokemonDetail,
  toPokemonSummary,
  toRelationsByType,
  toTypeOptions,
} from './mappers.js';
import type { IndexEntry, PokemonIndex } from './pokemonIndex.js';
import {
  abilityDtoSchema,
  evolutionChainDtoSchema,
  generationDtoSchema,
  pokemonDtoSchema,
  resourceListDtoSchema,
  speciesDtoSchema,
  typeDtoSchema,
  type AbilityDto,
  type EvolutionChainDto,
  type PokemonDto,
  type SpeciesDto,
  type TypeDto,
} from './schemas.js';
import { fetchParsed } from './upstream.js';

const TYPE_LIST_PATH = '/type?limit=100';
const GENERATION_LIST_PATH = '/generation';

export interface PokeApiPokemonRepositoryDeps {
  readonly client: JsonHttpClient;
  readonly index: PokemonIndex;
  readonly caches: RepositoryCaches;
}

/**
 * Implementa a porta `PokemonRepository` orquestrando os 6 endpoints da PokéAPI. Tudo passa pelo
 * cache (ADR-002) e é validado na borda (`fetchParsed`); o mapper traduz para o contrato e o domínio
 * calcula fraquezas e evolução. Este arquivo não conhece HTTP nem Fastify — só a porta de transporte.
 */
export class PokeApiPokemonRepository implements PokemonRepository {
  private readonly client: JsonHttpClient;
  private readonly index: PokemonIndex;
  private readonly caches: RepositoryCaches;

  constructor(deps: PokeApiPokemonRepositoryDeps) {
    this.client = deps.client;
    this.index = deps.index;
    this.caches = deps.caches;
  }

  async listPokemon(query: ListQuery): Promise<PokemonListPage> {
    await this.index.ensureLoaded();
    const matches = await this.filterIndex(query);
    const page = paginate(matches, query.page, query.pageSize);
    const items = await Promise.all(page.items.map((entry) => this.summaryById(entry.id)));

    return {
      items,
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    };
  }

  async getPokemonDetail(idOrName: string): Promise<PokemonDetail> {
    const pokemon = await this.pokemonByIdentifier(idOrName);
    if (pokemon.id > POKEDEX_LAST_ID) throw new PokemonNotFoundError(idOrName);

    // Espécie, habilidades e relações de dano não dependem umas das outras: paralelo (§7.5.4).
    const [species, abilities, relationsByType] = await Promise.all([
      this.speciesById(pokemon.species.id),
      this.abilitiesOf(pokemon),
      this.relationsByType(),
    ]);
    // A cadeia só é conhecida depois da espécie; os estágios, depois da cadeia.
    const chain = await this.chainById(species.evolution_chain.id);
    const stages = await this.stagesOf(chain);

    return toPokemonDetail({ pokemon, species, chain, abilities, relationsByType, stages });
  }

  async listTypes(): Promise<TypeOption[]> {
    const list = await this.caches.lists.getOrLoad('types', () =>
      fetchParsed(this.client, TYPE_LIST_PATH, resourceListDtoSchema),
    );
    return toTypeOptions(list.results);
  }

  async listGenerations(): Promise<GenerationOption[]> {
    const list = await this.caches.lists.getOrLoad('generations', () =>
      fetchParsed(this.client, GENERATION_LIST_PATH, resourceListDtoSchema),
    );
    return toGenerationOptions(list.results);
  }

  indexSize(): number {
    return this.index.size();
  }

  /** `q`, `type` e `generation` são interseção (§6.1); os conjuntos de ids vêm do upstream, cacheados. */
  private async filterIndex(query: ListQuery): Promise<IndexEntry[]> {
    const [typeIds, generationIds] = await Promise.all([
      query.type === undefined ? null : this.idsOfType(query.type),
      query.generation === undefined ? null : this.idsOfGeneration(query.generation),
    ]);

    return this.index
      .search(query.q ?? '')
      .filter((entry) => typeIds === null || typeIds.has(entry.id))
      .filter((entry) => generationIds === null || generationIds.has(entry.id));
  }

  private async idsOfType(type: TypeName): Promise<Set<number>> {
    const dto = await this.typeByName(type);
    return toPokedexIds(dto.pokemon.map((entry) => entry.pokemon));
  }

  private async idsOfGeneration(generation: GenerationName): Promise<Set<number>> {
    const dto = await this.caches.generations.getOrLoad(`generation:${generation}`, () =>
      fetchParsed(this.client, `/generation/${generation}`, generationDtoSchema),
    );
    return toPokedexIds(dto.pokemon_species);
  }

  private async summaryById(id: number): Promise<PokemonSummary> {
    return toPokemonSummary(await this.pokemonByIdentifier(String(id)));
  }

  private pokemonByIdentifier(idOrName: string): Promise<PokemonDto> {
    const identifier = idOrName.trim().toLowerCase();
    return this.caches.pokemon.getOrLoad(`pokemon:${identifier}`, () =>
      fetchParsed(this.client, `/pokemon/${encodeURIComponent(identifier)}`, pokemonDtoSchema),
    );
  }

  /** Sempre pelo id de `species.url`, nunca pelo nome do Pokémon (§2.3.4: `deoxys-normal` → `deoxys`). */
  private speciesById(id: number): Promise<SpeciesDto> {
    return this.caches.species.getOrLoad(`species:${String(id)}`, () =>
      fetchParsed(this.client, `/pokemon-species/${String(id)}`, speciesDtoSchema),
    );
  }

  private chainById(id: number): Promise<EvolutionChainDto> {
    return this.caches.chains.getOrLoad(`chain:${String(id)}`, () =>
      fetchParsed(this.client, `/evolution-chain/${String(id)}`, evolutionChainDtoSchema),
    );
  }

  private async abilitiesOf(pokemon: PokemonDto): Promise<Map<string, AbilityDto>> {
    const dtos = await Promise.all(
      pokemon.abilities.map((slot) =>
        this.caches.abilities.getOrLoad(`ability:${slot.ability.name}`, () =>
          fetchParsed(this.client, `/ability/${slot.ability.name}`, abilityDtoSchema),
        ),
      ),
    );
    return new Map(dtos.map((dto) => [dto.name, dto]));
  }

  private typeByName(type: TypeName): Promise<TypeDto> {
    return this.caches.types.getOrLoad(`type:${type}`, () =>
      fetchParsed(this.client, `/type/${type}`, typeDtoSchema),
    );
  }

  /** As relações dos 18 tipos mudam nunca: carregadas uma vez e servidas do cache (§7.5.5). */
  private async relationsByType(): Promise<DamageRelationsByType> {
    const dtos = await Promise.all(TYPE_NAMES.map((type) => this.typeByName(type)));
    return toRelationsByType(dtos);
  }

  /** Um `/pokemon/{speciesId}` por espécie da cadeia; espécie sem evolução não tem estágios. */
  private async stagesOf(chain: EvolutionChainDto): Promise<EvolutionStage[]> {
    const species = listEvolutionSpecies(toEvolutionChainNode(chain.chain));
    if (species.length <= 1) return [];

    return Promise.all(
      species.map(async (entry) => ({
        species: entry.name,
        pokemon: await this.summaryById(entry.id),
      })),
    );
  }
}
