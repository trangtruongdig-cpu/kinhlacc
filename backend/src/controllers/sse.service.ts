import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService {
  private events = new Subject<any>();

  // Dùng để push event
  emitEvent(data: any) {
    this.events.next(data);
  }

  // Dùng để subscribe
  getEventStream() {
    return this.events.asObservable();
  }
}
