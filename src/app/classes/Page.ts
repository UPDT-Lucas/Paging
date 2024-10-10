import { Pointer } from './Pointer';

export class Page {
  id: number;
  segmentDir:number|NULL;
  onRam: boolean;
  Bit: boolean;
  memoryUse:number;
  constructor(id: number, onRam: boolean, Bit: boolean,segmentDir:number,memoryUse:number){
    this.id = id;
    this.onRam = onRam;
    this.Bit = Bit;
    this.segmentDir = segmentDir;
    this.memoryUse=memoryUse;
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
 
  getmemoryUse():number{
    return this.memoryUse;
  }
  setmemoryUse():number{
    return this.memoryUse;
  }
  getSegmentDir(): number|NULL {
    return this.segmentDir;
  }
  setSegmentDir(idSeg:number):void{
    this.segmentDir=idSeg;
  }
}
