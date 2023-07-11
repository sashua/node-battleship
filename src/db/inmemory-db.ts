interface Data {
  id: number;
}

export class InmemoryDB<T extends Data> {
  protected _idMap = new Map<number, T>();

  public create(data: T): T {
    const item = { ...data };
    this._idMap.set(item.id, item);
    return item;
  }

  public find(id: number): T | null {
    return this._idMap.get(id) ?? null;
  }

  public findFirst(field: keyof T, value: unknown): T | null {
    for (const item of this.findAll()) {
      if (item[field] === value) return item;
    }
    return null;
  }

  public findMany(field: keyof T, value: unknown): T[] {
    const items: T[] = [];
    for (const item of this.findAll()) {
      if (item[field] === value) items.push(item);
    }
    return items;
  }

  public findAll() {
    return this._idMap.values();
  }

  public update(id: number, data: Partial<T>): T | null {
    const item = this.delete(id);
    if (!item) return null;
    return this.create({ ...item, ...data });
  }

  public delete(id: number): T | null {
    const item = this.find(id);
    if (!item) return null;
    this._idMap.delete(id);
    return item;
  }
}
