import { randomInt } from 'crypto';
import { Position } from './interfaces.js';

export class Board<T> {
  private _values: (T | null)[][];

  constructor(private _size = 10) {
    this._values = this._createValues(null);
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
  public getValue(pos: Position): T | null | undefined {
    if (this.isOutside(pos)) return undefined;
    return this._values[pos.y][pos.x];
  }

  public setValue(pos: Position, value: T | null) {
    if (this.isOutside(pos)) return;
    this._values[pos.y][pos.x] = value;
  }

  public setValues(pos: Position[], value: T | null) {
    pos.forEach((pos) => this.setValue(pos, value));
  }

  public setAllValues(val: T | null) {
    this._values = this._createValues(val);
  }

  // ----------------------------------------------------------------
  public isInside({ x, y }: Position) {
    return x >= 0 && x < this._size && y >= 0 && y < this._size;
  }

  public isOutside(pos: Position) {
    return !this.isInside(pos);
  }

  public isFree(pos: Position) {
    return this.getValue(pos) === null;
  }

  public areFree(positions: Position[]) {
    return positions.every((pos) => this.isFree(pos));
  }

  // ----------------------------------------------------------------
  public getFreePositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this._size; y++) {
      for (let x = 0; x < this._size; x++) {
        if (this._values[y][x] === null) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  public getRandomFreePosition(): Position | null {
    const positions = this.getFreePositions();
    if (!positions.length) return null;
    const randomIndex = randomInt(positions.length);
    return positions[randomIndex];
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  private _createValues(val: T | null): (T | null)[][] {
    return Array(this._size)
      .fill(null)
      .map(() => Array(this._size).fill(val));
  }
}
