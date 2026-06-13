import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminsService } from './controllers/admin.controller';
import { VaiTroService } from './controllers/vai-tro.controller';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminsService = app.get(AdminsService);
  const vaiTroService = app.get(VaiTroService);

  // 1) Đảm bảo 4 vai trò mặc định tồn tại.
  await vaiTroService.ensureDefaults();
  const adminRole = await vaiTroService.getAdminRole();
  if (!adminRole) {
    console.error('Không tạo được vai trò Quản Trị Viên — dừng seed.');
    await app.close();
    return;
  }

  // 2) Tạo / cập nhật tài khoản admin.
  const username = 'admin';
  const password = 'password123';

  const existingAdmin = await adminsService.findByUsername(username);
  if (existingAdmin) {
    if (!existingAdmin.vaiTroId) {
      await adminsService.setVaiTro(existingAdmin.id, adminRole.id);
      console.log(`Đã gán vai trò Quản Trị Viên cho '${username}'.`);
    } else {
      console.log(`Admin user '${username}' already exists.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await adminsService.create(username, passwordHash, {
      hoTen: 'Quản Trị Viên',
      vaiTroId: adminRole.id,
      trangThai: true,
    });
    console.log(`Admin user '${username}' created successfully with password '${password}'.`);
  }

  await app.close();
}

bootstrap();
