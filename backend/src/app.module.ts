import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Admin } from './models/admin.model';
import { VaiTro } from './models/vai-tro.model';
import { MeridianSyndrome } from './models/meridian-syndrome.model';
import { Patient } from './models/patient.model';
import { Examination } from './models/examination.model';
import { ChungBenh } from './models/chung-benh.model';
import { BenhTayY } from './models/benh-tay-y.model';
import { TrieuChung } from './models/trieu-chung.model';
import { KinhMach } from './models/kinh-mach.model';
import { HuyetVi } from './models/huyet-vi.model';
import { PhacDoDieuTri } from './models/phac-do-dieu-tri.model';
import { PhacDoChuan, PhacDoChuanHuyet } from './models/phac-do-chuan.model';
import { ViThuoc } from './models/vi-thuoc.model';
import { BaiThuoc } from './models/bai-thuoc.model';
import { BaiThuocChiTiet } from './models/bai-thuoc-chi-tiet.model';
import { TheBenh } from './models/the-benh.model';
import { TheBenhPhuongHuyet } from './models/the-benh-phuong-huyet.model';
import { ClinicScheduleConfig } from './models/clinic-schedule-config.model';
import { ClinicDayOverride } from './models/clinic-day-override.model';
import { AppointmentSlot } from './models/appointment-slot.model';
import { ThietChan } from './models/thiet-chan.model';
import { MachChan } from './models/mach-chan.model';
import { ViThuocCongDung } from './models/vi-thuoc-cong-dung.model';
import { ViThuocChuTri } from './models/vi-thuoc-chu-tri.model';
import { ViThuocKiengKy } from './models/vi-thuoc-kieng-ky.model';
import { ViThuocTenGoiKhac } from './models/vi-thuoc-ten-goi-khac.model';
import { ViThuocKinhMach } from './models/vi-thuoc-kinh-mach.model';
import { CongDung } from './models/cong-dung.model';
import { PhapTri } from './models/phap-tri.model';
import { PhapTriNguyenNhan } from './models/phap-tri-nguyen-nhan.model';
import { BaiThuocPhapTri } from './models/bai-thuoc-phap-tri.model';
import { LegacyMeridianSyndrome } from './models/legacy-meridian-syndrome.model';
import { BenhDongYExcel } from './models/benh-dong-y-excel.model';
import { BenhDongYExcelNguyenNhan } from './models/benh-dong-y-excel-nguyen-nhan.model';
import { SchemaBootstrapService } from './schema-bootstrap.service';
import { BenhDongYHienDai } from './models/benh-dong-y-hien-dai.model';
import { TonThuongTacNhan } from './models/ton-thuong-tac-nhan.model';
import { KinhMach3dAnchor } from './models/kinh-mach-3d-anchor.model';
import { SeoDoiThu } from './models/seo-doi-thu.model';
import { SeoUrl } from './models/seo-url.model';
import { SeoCum } from './models/seo-cum.model';
import { SeoBaiViet } from './models/seo-bai-viet.model';
import { ChanDoanLuoi } from './models/chan-doan-luoi.model';

import { ChuTri } from './models/chu-tri.model';
import { KiengKy } from './models/kieng-ky.model';
import { ChuTriController } from './controllers/chu-tri.controller';
import { KiengKyController } from './controllers/kieng-ky.controller';
import { NhomLonDuocLy } from './models/nhom-lon-duoc-ly.model';
import { NhomNhoDuocLy } from './models/nhom-nho-duoc-ly.model';
import { NhomNhoViThuoc } from './models/nhom-nho-vi-thuoc.model';
import { NhomNhoChuTri } from './models/nhom-nho-chu-tri.model';

// Routers (NestJS Controllers)
import { AdminsRouter } from './routers/admin.router';
import { AuthRouter } from './routers/auth.router';
import { VaiTroRouter } from './routers/vai-tro.router';
import { NguoiDungRouter } from './routers/nguoi-dung.router';
import { MeridiansRouter } from './routers/meridian.router';
import { PatientsRouter } from './routers/patient.router';
import { ExaminationsRouter } from './routers/examination.router';
import { RecordsRouter } from './routers/record.router';
import { ChungBenhRouter } from './routers/chung-benh.router';
import { BenhTayYRouter } from './routers/benh-tay-y.router';
import { TrieuChungRouter } from './routers/trieu-chung.router';
import { KinhMachRouter } from './routers/kinh-mach.router';
import { HuyetViRouter } from './routers/huyet-vi.router';
import { PhacDoDieuTriRouter } from './routers/phac-do-dieu-tri.router';
import { PhacDoChuanRouter } from './routers/phac-do-chuan.router';
import { ViThuocRouter } from './routers/vi-thuoc.router';
import { BaiThuocRouter } from './routers/bai-thuoc.router';
import { GraphRouter } from './routers/graph.router';
import { GraphService } from './controllers/graph.controller';
import { DuocLieuRouter } from './routers/duoc-lieu.router';
import { TheBenhRouter, TheBenhPhuongHuyetRouter } from './routers/the-benh.router';
import { PatientAuthRouter } from './routers/patient-auth.router';
import { ClinicScheduleRouter } from './routers/clinic-schedule.router';
import { AppointmentSlotsRouter } from './routers/appointment-slot.router';
import { ThietChanRouter } from './routers/thiet-chan.router';
import { MachChanRouter } from './routers/mach-chan.router';
import { CongDungRouter } from './routers/cong-dung.router';
import { PhapTriRouter } from './routers/phap-tri.router';
import { BenhDongYExcelRouter } from './routers/benh-dong-y-excel.router';
import { BenhDongYRouter } from './routers/benh-dong-y.router';
import { BenhDongYHienDaiRouter } from './routers/benh-dong-y-hien-dai.router';
import { NhomLonDuocLyRouter } from './routers/nhom-lon-duoc-ly.router';
import { NhomNhoDuocLyRouter } from './routers/nhom-nho-duoc-ly.router';
import { AiSuggestRouter } from './routers/ai-suggest.router';
import { TonThuongTacNhanRouter } from './routers/ton-thuong-tac-nhan.router';
import { KinhMach3dRouter } from './routers/kinh-mach-3d.router';
import { DemoRouter } from './routers/demo.router';
import { SeoRouter } from './routers/seo.router';
import { SeoBlogRouter } from './routers/seo-blog.router';
import { GscRouter } from './routers/gsc.router';
import { ChanDoanLuoiRouter } from './routers/chan-doan-luoi.router';

// Controllers (NestJS Services)
import { AdminsService } from './controllers/admin.controller';
import { AuthService } from './controllers/auth.controller';
import { VaiTroService } from './controllers/vai-tro.controller';
import { NguoiDungService } from './controllers/nguoi-dung.controller';
import { MeridiansService } from './controllers/meridian.controller';
import { PatientsService } from './controllers/patient.controller';
import { ExaminationsService } from './controllers/examination.controller';
import { ChungBenhService } from './controllers/chung-benh.controller';
import { BenhTayYService } from './controllers/benh-tay-y.controller';
import { TrieuChungService } from './controllers/trieu-chung.controller';
import { KinhMachService } from './controllers/kinh-mach.controller';
import { HuyetViService } from './controllers/huyet-vi.controller';
import { PhacDoDieuTriService } from './controllers/phac-do-dieu-tri.controller';
import { PhacDoChuanService } from './controllers/phac-do-chuan.controller';
import { ViThuocService } from './controllers/vi-thuoc.controller';
import { BaiThuocService } from './controllers/bai-thuoc.controller';
import { TheBenhService, TheBenhPhuongHuyetService } from './controllers/the-benh.controller';
import { PatientAuthService } from './controllers/patient-auth.controller';
import { ClinicScheduleService } from './controllers/clinic-schedule.controller';
import { AppointmentSlotsService } from './controllers/appointment-slot.controller';
import { FirebaseService } from './controllers/firebase.controller';
import { ThietChanService } from './controllers/thiet-chan.controller';
import { MachChanService } from './controllers/mach-chan.controller';
import { CongDungService } from './controllers/cong-dung.controller';
import { PhapTriService } from './controllers/phap-tri.controller';
import { BenhDongYExcelService } from './controllers/benh-dong-y-excel.controller';
import { BenhDongYHienDaiService } from './controllers/benh-dong-y-hien-dai.controller';
import { NhomLonDuocLyService } from './controllers/nhom-lon-duoc-ly.controller';
import { NhomNhoDuocLyService } from './controllers/nhom-nho-duoc-ly.controller';
import { AiSuggestService } from './controllers/ai-suggest.controller';
import { TonThuongTacNhanService } from './controllers/ton-thuong-tac-nhan.controller';
import { KinhMach3dService } from './controllers/kinh-mach-3d.controller';
import { SeoService } from './controllers/seo.controller';
import { GscService } from './controllers/gsc.controller';
import { ChanDoanLuoiService } from './controllers/chan-doan-luoi.controller';

// Middlewares (Strategies/Guards)
import { JwtStrategy } from './middlewares/auth/jwt.strategy';
import { JwtAuthGuard } from './middlewares/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Vercel serverless cần pool nhỏ + idle timeout ngắn để tránh giữ socket.
        // Dev/PM2/Docker chạy lâu dài -> pool rộng hơn, idle dài hơn, keepAlive.
        const isServerless =
          !!configService.get<string>('VERCEL') ||
          !!configService.get<string>('AWS_LAMBDA_FUNCTION_NAME');
        const poolMax = parseInt(
          configService.get<string>('DB_POOL_MAX') ||
            (isServerless ? '1' : '10'),
          10,
        );
        const idleTimeout = parseInt(
          configService.get<string>('DB_IDLE_TIMEOUT_MS') ||
            (isServerless ? '1000' : '30000'),
          10,
        );
        const connectionTimeout = parseInt(
          configService.get<string>('DB_CONNECTION_TIMEOUT_MS') || '15000',
          10,
        );
        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL') || configService.get<string>('POSTGRES_URL'),
          host: configService.get<string>('DB_HOST') || configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('DB_PORT') || configService.get<number>('POSTGRES_PORT') || 5432,
          username: configService.get<string>('DB_USER') || configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('DB_PASSWORD') || configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('DB_NAME') || configService.get<string>('POSTGRES_DATABASE'),
          ssl: configService.get<string>('DB_SSL') === 'false' ? false : { rejectUnauthorized: false },
          extra: {
            max: poolMax,
            connectionTimeoutMillis: connectionTimeout,
            idleTimeoutMillis: idleTimeout,
            keepAlive: !isServerless,
          },
          poolSize: poolMax,
          retryAttempts: 2,
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ChanDoanLuoi, Admin, VaiTro, MeridianSyndrome, LegacyMeridianSyndrome, Patient, Examination, ChungBenh, BenhTayY, TrieuChung, KinhMach, HuyetVi, PhacDoDieuTri, PhacDoChuan, PhacDoChuanHuyet, ViThuoc, BaiThuoc, BaiThuocChiTiet, BaiThuocPhapTri, TheBenh, TheBenhPhuongHuyet, ClinicScheduleConfig, ClinicDayOverride, AppointmentSlot, ThietChan, MachChan, ViThuocCongDung, ViThuocChuTri, ViThuocKiengKy, ViThuocTenGoiKhac, ViThuocKinhMach, CongDung, ChuTri, KiengKy, PhapTri, PhapTriNguyenNhan, BenhDongYExcel, BenhDongYExcelNguyenNhan, BenhDongYHienDai, NhomLonDuocLy, NhomNhoDuocLy, NhomNhoViThuoc, NhomNhoChuTri, TonThuongTacNhan, KinhMach3dAnchor, SeoDoiThu, SeoUrl, SeoCum, SeoBaiViet]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret_key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, ChanDoanLuoiRouter, AdminsRouter, AuthRouter, VaiTroRouter, NguoiDungRouter, MeridiansRouter, PatientsRouter, ExaminationsRouter, RecordsRouter, ChungBenhRouter, BenhTayYRouter, TrieuChungRouter, KinhMachRouter, HuyetViRouter, PhacDoDieuTriRouter, PhacDoChuanRouter, ViThuocRouter, BaiThuocRouter, TheBenhRouter, TheBenhPhuongHuyetRouter, PatientAuthRouter, ClinicScheduleRouter, AppointmentSlotsRouter, ThietChanRouter, MachChanRouter, CongDungRouter, PhapTriRouter, BenhDongYExcelRouter, BenhDongYRouter, BenhDongYHienDaiRouter, ChuTriController, KiengKyController, NhomLonDuocLyRouter, NhomNhoDuocLyRouter, AiSuggestRouter, TonThuongTacNhanRouter, KinhMach3dRouter, DemoRouter, SeoRouter, SeoBlogRouter, GscRouter, GraphRouter, DuocLieuRouter],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }, AppService, ChanDoanLuoiService, AdminsService, AuthService, VaiTroService, NguoiDungService, JwtStrategy, MeridiansService, PatientsService, ExaminationsService, ChungBenhService, BenhTayYService, TrieuChungService, KinhMachService, HuyetViService, PhacDoDieuTriService, PhacDoChuanService, ViThuocService, BaiThuocService, TheBenhService, TheBenhPhuongHuyetService, PatientAuthService, ClinicScheduleService, AppointmentSlotsService, FirebaseService, ThietChanService, MachChanService, CongDungService, PhapTriService, BenhDongYExcelService, BenhDongYHienDaiService, NhomLonDuocLyService, NhomNhoDuocLyService, AiSuggestService, TonThuongTacNhanService, KinhMach3dService, SeoService, GscService, GraphService, SchemaBootstrapService],
})
export class AppModule {}
