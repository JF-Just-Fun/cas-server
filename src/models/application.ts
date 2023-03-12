import {
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Timestamp,
} from 'typeorm';

@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  // 应用名称
  @Column('varchar', { nullable: true })
  name: string;

  // 描述
  @Column('varchar', { nullable: true })
  desc: string;

  // IP地址
  @Column('varchar', { nullable: true })
  ip: string;

  // 域名
  @Column('varchar', { nullable: true })
  domain: string;

  // 应用token
  @Column('varchar', { nullable: true })
  token: string;

  // 应用unique id
  @Column('varchar', { nullable: false, unique: true })
  unId: string;

  // 是否启用
  @Column('boolean', { nullable: true })
  active: boolean;

  // 有效期限
  @Column('date', { nullable: true })
  expire: Date;

  @CreateDateColumn({
    name: 'create_time',
    nullable: true,
  })
  createTime: Date;

  @UpdateDateColumn({
    name: 'update_time',
    nullable: true,
  })
  updateTime: Date | null;

  @DeleteDateColumn({
    name: 'delete_at',
    nullable: true,
  })
  deleteAt: Date | null;
}

export default Application;
