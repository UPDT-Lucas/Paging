import { Process } from '../classes/Process';
import { Pointer } from '../classes/Pointer';

export interface IMMU {
  RAM: number;
  pageSize: number;
  currentMemUsage: number;
  clock: number;
  pageConsecutive: number;
  pointerConsecutive: number;
  processes: Process[];

  getProcessByID(id: number): Process;
  getProcessByPointerId(id: number): Process;
  createProcess(): void;
  createPointer(): Pointer;
  cNewProcess(): void;
  cKillProcess(): void;
  cDeleteProcess(): void;
}
