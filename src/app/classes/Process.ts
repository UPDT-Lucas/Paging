import { Pointer } from './Pointer';

export class Process {
  id: number;
  pointers: Pointer[];

  constructor(id: number, pointers: Pointer[]) {
    this.id = id;
    this.pointers = pointers;
  }

  getPointers(): Pointer[] {
    return this.pointers;
  }

  getId(): number {
    return this.id;
  }

  addPointer(pointer: Pointer): void {
    this.pointers.push(pointer);
  }

  isPointerInProcess(pointer: Pointer): boolean {
    return this.pointers.includes(pointer);
  }

  removePointer(pointer: Pointer): void {
    this.pointers = this.pointers.filter((p) => p.id !== pointer.id);
  }

  printPointer(): void {
    this.pointers.forEach((pointer) => {
      console.log(`Pointer ${pointer.id}: ${pointer.fragmentation}`);
    });
  }
}
