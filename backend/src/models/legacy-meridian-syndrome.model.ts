import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('legacy_meridian_syndromes')
export class LegacyMeridianSyndrome {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  nhomid: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tieuket: string | null;

  @Column({ type: 'text', nullable: true })
  trieuchung: string | null;

  @Column({ type: 'text', nullable: true })
  benhly: string | null;

  @Column({ type: 'text', nullable: true })
  phuyet_chamcuu: string | null;

  @Column({ type: 'text', nullable: true })
  giainghia_phuyet: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duyet: string | null;

  @Column({ type: 'smallint', default: 0 }) tieutruong_c8: number;
  @Column({ type: 'smallint', default: 0 }) tieutruong: number;
  @Column({ type: 'smallint', default: 0 }) tieutruong_c11: number;

  @Column({ type: 'smallint', default: 0 }) tam_c8: number;
  @Column({ type: 'smallint', default: 0 }) tam: number;
  @Column({ type: 'smallint', default: 0 }) tam_c11: number;

  @Column({ type: 'smallint', default: 0 }) tamtieu_c8: number;
  @Column({ type: 'smallint', default: 0 }) tamtieu: number;
  @Column({ type: 'smallint', default: 0 }) tamtieu_c11: number;

  @Column({ type: 'smallint', default: 0 }) tambao_c8: number;
  @Column({ type: 'smallint', default: 0 }) tambao: number;
  @Column({ type: 'smallint', default: 0 }) tambao_c11: number;

  @Column({ type: 'smallint', default: 0 }) daitrang_c8: number;
  @Column({ type: 'smallint', default: 0 }) daitrang: number;
  @Column({ type: 'smallint', default: 0 }) daitrang_c11: number;

  @Column({ type: 'smallint', default: 0 }) phe_c8: number;
  @Column({ type: 'smallint', default: 0 }) phe: number;
  @Column({ type: 'smallint', default: 0 }) phe_c11: number;

  @Column({ type: 'smallint', default: 0 }) bangquang_c8: number;
  @Column({ type: 'smallint', default: 0 }) bangquang: number;
  @Column({ type: 'smallint', default: 0 }) bangquang_c11: number;

  @Column({ type: 'smallint', default: 0 }) than_c8: number;
  @Column({ type: 'smallint', default: 0 }) than: number;
  @Column({ type: 'smallint', default: 0 }) than_c11: number;

  @Column({ type: 'smallint', default: 0 }) dam_c8: number;
  @Column({ type: 'smallint', default: 0 }) dam: number;
  @Column({ type: 'smallint', default: 0 }) dam_c11: number;

  @Column({ type: 'smallint', default: 0 }) vi_c8: number;
  @Column({ type: 'smallint', default: 0 }) vi: number;
  @Column({ type: 'smallint', default: 0 }) vi_c11: number;

  @Column({ type: 'smallint', default: 0 }) can_c8: number;
  @Column({ type: 'smallint', default: 0 }) can: number;
  @Column({ type: 'smallint', default: 0 }) can_c11: number;

  @Column({ type: 'smallint', default: 0 }) ty_c8: number;
  @Column({ type: 'smallint', default: 0 }) ty: number;
  @Column({ type: 'smallint', default: 0 }) ty_c11: number;
}
