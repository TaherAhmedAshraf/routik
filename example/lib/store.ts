export interface Identifiable {
  id: string;
}

export class Store<T extends Identifiable> {
  private items: Map<string, T> = new Map();

  all(): T[] {
    return Array.from(this.items.values());
  }

  find(id: string): T | undefined {
    return this.items.get(id);
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return this.all().filter(predicate);
  }

  create(item: T): T {
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }
}
