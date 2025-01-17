import { Pointer } from './Pointer';

export class Page {
  id: number;

  segmentDir:number|undefined|null;
  onRam: boolean;
  Bit: boolean;
  memoryUse:number;
  constructor(id: number, onRam: boolean, Bit: boolean,segmentDir:number|undefined|null,memoryUse:number){
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

  changeRam(toChange: Page): Page {
    toChange.toggleRam();
    return toChange;
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

  getSegmentDir(): number|undefined|null {
    return this.segmentDir;
  }
  setSegmentDir(idSeg:number|undefined|null):void{
    this.segmentDir=idSeg;
  }
}
