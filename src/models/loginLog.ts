import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import User from './user';
import Common from './common';

@Entity()
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  // 外键
  @ManyToOne(() => User, (user) => user.id)
  user: User;

  // IP地址
  @Column('varchar', { nullable: true })
  ip: string;

  // 归属地
  @Column('varchar', { nullable: true })
  region: string;

  // 来源系统
  @Column('varchar', { nullable: true })
  source: string;

  // 操作类型（login、logout）
  @Column('varchar', { nullable: true })
  type: string;

  // 浏览器信息
  @Column('varchar', { nullable: true })
  userAgent: string;

  // 是否位单点登录
  @Column('boolean', { nullable: true })
  is_sso: boolean;

  // 账号类型（email、phoneNumber）
  @Column('varchar', { nullable: true })
  account_type: string;

  @Column(() => Common)
  common: Common;
}

export default LoginLog;
