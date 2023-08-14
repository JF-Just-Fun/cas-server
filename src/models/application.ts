import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import Common from './common';

@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  // 应用名称
  @Column('varchar', { unique: true })
  name: string;

  // 描述
  @Column('varchar', { nullable: true })
  desc: string;

  // 域名
  @Column('varchar', { unique: true })
  domain: string;

  // 应用token
  @Column('varchar', { unique: true })
  token: string;

  // 有效期限
  @Column('datetime', { nullable: true })
  expire: Date;

  @Column(() => Common)
  common: Common;
}

export default Application;
