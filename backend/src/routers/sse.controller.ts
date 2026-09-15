import { Controller, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService } from '../controllers/sse.service';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('notifications')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @UseGuards(JwtAuthGuard) // Chỉ cho admin (có token)
  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.sseService.getEventStream().pipe(
      map((payload) => ({
        data: payload,
      } as MessageEvent)),
    );
  }
}
