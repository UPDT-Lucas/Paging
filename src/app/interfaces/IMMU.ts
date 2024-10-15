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
  createProcess(pid: number): Process;
  createPointer(frag:number): Pointer;
  cNewProcess(pid: number, size: number): void;
  cKillProcess(pid:number): void;
  cDeleteProcess(pi:number): void;
}
