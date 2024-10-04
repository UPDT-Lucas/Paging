export class Pointer {
  id: number;
  fragmentation: string;

  constructor(id: number, fragmentation: string) {
    this.id = id;
    this.fragmentation = fragmentation;
  }

  getId(): number {
    return this.id;
  }
}
