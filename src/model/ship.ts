import { Position, ShipData } from '../types/game-types.js';

export class Ship {
  private _deckPositions: Position[];
  private _aroundPositions: Position[];
  private _health: boolean[];

  constructor(
    private _position: ShipData['position'],
    private _direction: ShipData['direction'],
    private _length: ShipData['length'],
    private _type: ShipData['type']
  ) {
    this._deckPositions = this.getDeckPositions();
    this._aroundPositions = this.getAroundPositions();
    this._health = new Array(_length).fill(true);
  }

  // ----------------------------------------------------------------
  // Getters & Setters
  // ----------------------------------------------------------------
  public get shipData(): ShipData {
    return {
      position: this._position,
      direction: this._direction,
      length: this._length,
      type: this._type,
    };
  }

  public get killed() {
    return this._health.every((v) => !v);
  }

  public get deckPositions() {
    return this._deckPositions;
  }

  public get aroundPositions() {
    return this._aroundPositions;
  }

  public set position(position: Position) {
    this._position = position;
    this._deckPositions = this.getDeckPositions();
    this._aroundPositions = this.getAroundPositions();
  }

  public set direction(direction: boolean) {
    this._direction = direction;
    this._deckPositions = this.getDeckPositions();
    this._aroundPositions = this.getAroundPositions();
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public getShot(position: Position) {
    if (!this.isDeck(position)) return false;
    const deckIndex = this._direction
      ? position.y - this._position.y
      : position.x - this._position.x;
    this._health[deckIndex] = false;
    return true;
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  private isDeck({ x, y }: Position) {
    const xDistance = x - this._position.x;
    const yDistance = y - this._position.y;
    return this._direction
      ? !xDistance && yDistance >= 0 && yDistance < this._length
      : !yDistance && xDistance >= 0 && xDistance < this._length;
  }

  // ----------------------------------------------------------------
  private getDeckPositions() {
    const { x, y } = this._position;
    const positions: Position[] = [];
    for (let i = 0; i < this._length; i++) {
      positions.push(this._direction ? { x, y: y + i } : { x: x + i, y });
    }
    return positions;
  }

  // ----------------------------------------------------------------
  private getAroundPositions() {
    const firstDeck = this._position;
    const lastDeck = this._deckPositions.at(-1) ?? this._position;

    const positions = this._deckPositions.reduce((acc, { x, y }) => {
      this._direction
        ? acc.push({ x: x + 1, y }, { x: x - 1, y })
        : acc.push({ x, y: y + 1 }, { x, y: y - 1 });
      return acc;
    }, [] as Position[]);

    positions.push(
      ...[-1, 0, 1].map((v) =>
        this._direction
          ? { x: firstDeck.x + v, y: firstDeck.y - 1 }
          : { x: firstDeck.x - 1, y: firstDeck.y + v }
      )
    );

    positions.push(
      ...[-1, 0, 1].map((v) =>
        this._direction
          ? { x: lastDeck.x + v, y: lastDeck.y + 1 }
          : { x: lastDeck.x + 1, y: lastDeck.y + v }
      )
    );

    return positions;
  }
}
