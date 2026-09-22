/**
 * Erros de negócio tipados (§5.3). Definidos pela necessidade do chamador: o error handler HTTP
 * decide o status pelo tipo, nunca pela origem. As mensagens de `PokemonNotFoundError` podem ser
 * exibidas ao usuário; as de `UpstreamUnavailableError` são para o log e nunca vazam ao cliente.
 */

export class PokemonNotFoundError extends Error {
  readonly identifier: string;

  constructor(identifier: string) {
    super(`Pokémon '${identifier}' não encontrado.`);
    this.name = 'PokemonNotFoundError';
    this.identifier = identifier;
  }
}

export class UpstreamUnavailableError extends Error {
  constructor(reason: string, options?: ErrorOptions) {
    super(`PokéAPI indisponível: ${reason}`, options);
    this.name = 'UpstreamUnavailableError';
  }
}
