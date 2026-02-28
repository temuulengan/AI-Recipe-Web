export interface JwtPayload {
  sub: string;        // user id (PK)
  username: string;   // username
  role: string;       // USER or ADMIN
  iat?: number;       // issued at
  exp?: number;       // expiration time
}

export interface SanitizedUser {
  id: string;
  user_id: string;
  username: string;
  nickname: string;
  email: string;
  role: string;
  llm_count: number;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}
