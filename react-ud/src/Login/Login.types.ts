export interface LoginRequest {
  userid: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  msg: string;
  data: {
    token: string;
    userId: string;
    username: string;
  } | null;
}