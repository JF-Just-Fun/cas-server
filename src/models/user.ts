import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import LoginLog from './loginLog';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // 昵称
  @Column('varchar', { length: 20, unique: true })
  name: string;

  // 密码
  @Column('varchar', { length: 200 })
  password: string;

  // 性别
  @Column('varchar', { nullable: true })
  gender: string;

  // 邮箱
  @Column('varchar', { nullable: true, unique: true, length: 20 })
  email: string;

  // 生日
  @Column('date', { nullable: true })
  birth: string;

  //账号id（UUID）
  @Column('varchar', { unique: true, length: 200 })
  account_id: string;

  // 电话
  @Column('varchar', { nullable: true, unique: true, length: 20 })
  phone: string;

  // 头像
  @Column('varchar', { default: '/avatar' })
  avatar: string;

  // 管理身份
  @Column('boolean', { default: false })
  manager: boolean;

  // 外键
  @OneToMany(() => LoginLog, (loginLog) => loginLog.user)
  LoginLog: LoginLog[];

  // 是否启用
  @Column('boolean', { default: true })
  active: boolean;

  @CreateDateColumn({
    name: 'create_time',
  })
  createTime: Date;

  @UpdateDateColumn({
    name: 'update_time',
  })
  updateTime: Date;

  @DeleteDateColumn({
    name: 'delete_at',
  })
  deleteTime: Date;
}

export default User;
