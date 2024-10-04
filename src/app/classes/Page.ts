import { Pointer } from './Pointer';

export class Page {
  id: number;
  onRam: boolean;
  Bit: boolean;
  pointers: Pointer[];

  constructor(id: number, onRam: boolean, Bit: boolean, pointers: Pointer[]) {
    this.id = id;
    this.onRam = onRam;
    this.Bit = Bit;
    this.pointers = pointers;
  }

  getId(): number {
    return this.id;
  }

  getBit(): boolean {
    return this.Bit;
  }

  isOnRam(): boolean {
    return this.onRam;
  }

  toggleRam(): void {
    this.onRam = !this.onRam;
  }

  toggleBit(): void {
    this.Bit = !this.Bit;
  }

  getPointers(): Pointer[] {
    return this.pointers;
  }
}
