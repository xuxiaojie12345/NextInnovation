export interface LoginRequest {
  userid: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userid: string;
    username: string;
  } | null;
}
