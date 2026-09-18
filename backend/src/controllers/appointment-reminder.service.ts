import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSlot } from '../models/appointment-slot.model';
import { FirebaseService } from './firebase.controller';
import { PatientsService } from './patient.controller';
import { SseService } from './sse.service';
import dayjs from 'dayjs';
// Nạp plugin bằng `import`, KHÔNG phải `require()`: chỉ đường import mới mang theo phần khai
// báo kiểu mở rộng, nhờ đó TypeScript mới biết `dayjs.tz` tồn tại. Dùng require thì mã vẫn
// chạy nhưng `.tz` là lỗi kiểu bị bỏ qua âm thầm — backend build bằng SWC nên không ai thấy.
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(AppointmentSlot)
    private slotsRepository: Repository<AppointmentSlot>,
    private firebaseService: FirebaseService,
    private patientsService: PatientsService,
    private sseService: SseService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    // 1. Lấy thời gian hiện tại theo VN
    const nowVn = dayjs().tz('Asia/Ho_Chi_Minh');
    const todayStr = nowVn.format('YYYY-MM-DD');

    // 2. Tìm tất cả lịch khám trạng thái BOOKED của ngày hôm nay
    const upcomingSlots = await this.slotsRepository.find({
      where: {
        slotDate: todayStr,
        status: 'BOOKED',
      },
    });

    if (!upcomingSlots.length) return;

    for (const slot of upcomingSlots) {
      if (!slot.patientId) continue;

      // slotTime có dạng "14:00:00"
      const slotDateTimeVn = dayjs.tz(`${todayStr} ${slot.slotTime}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh');
      
      const diffMinutes = slotDateTimeVn.diff(nowVn, 'minute');

      // Chỉ quan tâm tương lai gần (ví dụ còn trong vòng 65 phút)
      if (diffMinutes < 0 || diffMinutes > 65) continue;

      let shouldUpdate = false;
      let notificationMsg = '';

      if (diffMinutes <= 15 && !slot.reminded15m) {
        notificationMsg = `Lịch trị liệu của bạn sẽ bắt đầu sau 15 phút nữa (${slot.slotTime}).`;
        slot.reminded15m = true;
        shouldUpdate = true;
      } else if (diffMinutes <= 30 && diffMinutes > 15 && !slot.reminded30m) {
        notificationMsg = `Lịch trị liệu của bạn sẽ bắt đầu sau 30 phút nữa (${slot.slotTime}).`;
        slot.reminded30m = true;
        shouldUpdate = true;
      } else if (diffMinutes <= 60 && diffMinutes > 30 && !slot.reminded1h) {
        notificationMsg = `Lịch trị liệu của bạn sẽ bắt đầu trong 1 tiếng nữa (${slot.slotTime}). Bạn vui lòng đến đúng giờ nhé.`;
        slot.reminded1h = true;
        shouldUpdate = true;
      }

      if (shouldUpdate && notificationMsg) {
        // Nhắc NGAY trong ứng dụng qua SSE, không phụ thuộc Firebase.
        // Thông báo đẩy chỉ tới được người đã cài app và đã cho phép; ai đang MỞ sẵn ứng dụng
        // trên web thì đây là đường duy nhất. Phát trước vì nó rẻ và tức thì.
        //
        // `targetPatientId` khiến SseController CHỈ gửi cho đúng người này — lời nhắc có giờ
        // hẹn, không được lọt sang bệnh nhân khác.
        this.sseService.emitEvent({
          type: 'APPOINTMENT_REMINDER',
          targetPatientId: slot.patientId,
          message: notificationMsg,
          slot: {
            id: slot.id,
            slotDate: slot.slotDate,
            slotTime: slot.slotTime,
            status: slot.status,
          },
        });

        try {
          const patient = await this.patientsService.findOne(slot.patientId);
          if (patient?.fcmToken) {
            await this.firebaseService.sendNotification(patient.fcmToken, 'Nhắc nhở lịch hẹn', notificationMsg, {
              slotId: slot.id.toString(),
              type: 'APPOINTMENT_REMINDER',
            });
            this.logger.log(`Sent reminder to patient ${patient.id} for slot ${slot.id}: ${diffMinutes}m left`);
          }
          // CHỈ ghi 3 cột cờ, KHÔNG `save(slot)` cả bản ghi.
          //
          // `slot` được đọc từ đầu phút. Nếu trong lúc đó bệnh nhân huỷ lịch (huỷ sẽ xoá
          // patientId và trả ô giờ về OPEN) thì save cả entity sẽ ghi đè ngược bản cũ lên,
          // làm vé "sống lại" ở trạng thái BOOKED kèm bệnh nhân đã huỷ.
          await this.slotsRepository.update(
            { id: slot.id },
            {
              reminded1h: slot.reminded1h,
              reminded30m: slot.reminded30m,
              reminded15m: slot.reminded15m,
            },
          );
        } catch (error) {
          this.logger.error(`Error sending reminder for slot ${slot.id}`, error);
        }
      }
    }
  }
}
