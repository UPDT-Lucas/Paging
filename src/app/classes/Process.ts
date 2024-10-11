import { Pointer } from './Pointer';

export class Process {
  id: number;
  pointers: Pointer[];

  constructor(id: number) {
    this.id = id;
    this.pointers = [];
  }

  getPointers(): Pointer[] {
    return this.pointers;
  }

  getPointerById(id: number): Pointer {
    const p = this.pointers.find((pointer) => pointer.id === id);
    if (p) {
      return p;
    } else {
      throw new Error('Pointer not found');
    }
  }

  getId(): number {
    return this.id;
  }

  addPointer(pointer: Pointer): void {
    this.pointers.push(pointer);
    console.log('XD');
  }

  isPointerInProcess(id: number): boolean {
    return this.pointers.some((pointer) => pointer.id === id);
  }

  removePointer(pointer: Pointer): void {
    this.pointers = this.pointers.filter((p) => p.id !== pointer.id);
  }

  printPointers(): void {
    this.pointers.forEach((pointer) => {
      console.log(`Pointer ${pointer.id}: ${pointer.fragmentation}`);
    });
  }
}
