import { Position } from './interfaces.js';

export class Ship {
  private _positions: Position[];
  private _aroundPositions: Position[];
  private _health: boolean[];

  constructor(
    private _position: Position,
    private _length: number,
    private _isVertical: boolean
  ) {
    this._positions = this._getPositions();
    this._aroundPositions = this._getAroundPositions();
    this._health = Array(_length).fill(true);
  }

  // ----------------------------------------------------------------
  // Getters & Setters
  // ----------------------------------------------------------------
  public get position() {
    return this._position;
  }

  public set position(pos: Position) {
    this._position = pos;
    this._positions = this._getPositions();
    this._aroundPositions = this._getAroundPositions();
  }

  public get length() {
    return this._length;
  }

  public get positions(): Position[] {
    return this._positions;
  }

  public get aroundPositions(): Position[] {
    return this._aroundPositions;
  }

  public get isVertical() {
    return this._isVertical;
  }

  public set isVertical(isVertical: boolean) {
    this._isVertical = isVertical;
    this._positions = this._getPositions();
    this._aroundPositions = this._getAroundPositions();
  }

  public get isHorizontal() {
    return !this._isVertical;
  }

  public get isDestroyed() {
    return this._health.every((v) => !v);
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public getShot(pos: Position): boolean {
    if (!this._isShip(pos)) return false;
    const distance = this._isVertical ? pos.y - this._position.y : pos.x - this._position.x;
    this._health[distance] = false;
    return true;
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  public _isShip({ x, y }: Position) {
    const xDistance = x - this._position.x;
    const yDistance = y - this._position.y;
    return this._isVertical
      ? xDistance === 0 && yDistance >= 0 && yDistance < this._length
      : yDistance === 0 && xDistance >= 0 && xDistance < this._length;
  }

  private _getPositions(): Position[] {
    const { x, y } = this._position;
    const positions: Position[] = [];
    for (let i = 0; i < this._length; i++) {
      positions.push(this._isVertical ? { x, y: y + i } : { x: x + i, y });
    }
    return positions;
  }

  private _getAroundPositions(): Position[] {
    const { x, y } = this._position;
    const topLeft = { x: x - 1, y: y - 1 };
    const bottomRight = this._isVertical
      ? { x: x + 1, y: y + this._length }
      : { x: x + this._length, y: y + 1 };

    const positions: Position[] = [];
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        if (!this._isShip({ x, y })) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}
