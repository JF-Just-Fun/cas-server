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
  @Column('varchar', { unique: true, length: 200 })
  password: string;
  // 性别
  @Column('int', { unique: false })
  gender: number;
  // 邮箱
  @Column('varchar', { nullable: true, unique: true, length: 20 })
  email: string;
  // 生日
  @Column('date')
  birth: string;
  //账号id（UUID）
  @Column('varchar', { nullable: true, unique: true, length: 200 })
  account_id: string;
  // 电话
  @Column('varchar', { unique: false, length: 20 })
  phoneNumber: string;
  // 头像
  @Column('varchar', { nullable: false })
  avatar: string;
  // 外键
  @OneToMany(() => LoginLog, (loginLog) => loginLog.user)
  LoginLog: LoginLog[];
  // 是否启用
  @Column('boolean', { default: true })
  active: boolean;

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

export default User;
