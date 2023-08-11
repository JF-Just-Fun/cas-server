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
import Common from './common';

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
  @Column('varchar', { nullable: true, unique: true })
  token: string;

  // 应用id
  @Column('varchar', { nullable: false, unique: true })
  unId: string;

  // 有效期限
  @Column('datetime', { nullable: true })
  expire: Date;

  @Column(() => Common)
  common: Common;
}

export default Application;
