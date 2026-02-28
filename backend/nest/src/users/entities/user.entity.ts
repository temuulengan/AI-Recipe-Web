import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // PK, UUID

  @Column({ type: 'varchar', length: 64, nullable: false })
  user_id!: string; // 로그인 아이디

  @Column({ type: 'varchar', length: 100, nullable: false })
  username!: string; // 사용자 이름

  @Column({ type: 'varchar', length: 100, nullable: false })
  nickname!: string; // 사용자 닉네임

  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string; // 사용자 이메일

  @Column({ type: 'text', nullable: false })
  password!: string; // 비밀번호 + 솔트(해시)

  @Column({ type: 'varchar', length: 10, default: 'USER', nullable: false })
  role!: string; // USER / ADMIN 권한 구분

  @Column({ type: 'int', default: 0, comment: 'llm 질문 횟수' })
  llm_count!: number; // LLM 질문 횟수

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date; // 마지막 로그인 시각

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date; // 계정 생성 일자

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date; // 마지막 업데이트 일자
}
