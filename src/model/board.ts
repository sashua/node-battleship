import { randomInt } from 'crypto';
import { AttackStatus, Position } from '../types/game-types.js';

export class Board {
  private _values: (AttackStatus | null)[];

  constructor(private readonly _size = 10) {
    this._values = new Array(_size ** 2).fill(null);
  }

  // ----------------------------------------------------------------
  // Getters
  // ----------------------------------------------------------------
  get size() {
    return this._size;
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public getValue(position: Position) {
    return this.isValid(position) ? this._values[this.index(position)] : null;
  }

  // ----------------------------------------------------------------
  public setValue(position: Position, value: AttackStatus) {
    if (!this.isValid(position)) {
      return;
    }
    this._values[this.index(position)] = value;
  }

  // ----------------------------------------------------------------
  public setValues(positions: Position[], value: AttackStatus) {
    positions.forEach((position) => this.setValue(position, value));
  }

  // ----------------------------------------------------------------
  public getRandomFreePosition() {
    const freeIndexes: number[] = [];
    this._values.forEach((value, i) => {
      if (value === null) {
        freeIndexes.push(i);
      }
    });
    if (!freeIndexes.length) {
      return null;
    }
    const freeIndex = freeIndexes[randomInt(freeIndexes.length - 1)];
    return this.position(freeIndex);
  }

  // ----------------------------------------------------------------
  public isFree(position: Position) {
    return this.isValid(position) && this.getValue(position) === null;
  }

  // ----------------------------------------------------------------
  public isValid({ x, y }: Position) {
    return x >= 0 && x < this._size && y >= 0 && y < this._size;
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  private index({ x, y }: Position) {
    return y * this._size + x;
  }

  // ----------------------------------------------------------------
  private position(index: number) {
    return { x: index % this._size, y: Math.floor(index / this._size) };
  }
}
