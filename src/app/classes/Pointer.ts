export class Pointer {
  id: number;
  fragmentation: number;

  constructor(id: number, fragmentation: number) {
    this.id = id;
    this.fragmentation = fragmentation;
  }

  getId(): number {
    return this.id;
  }
}
