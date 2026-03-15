declare namespace Express {
  interface Request {
    auth?: {
      userId: number;
      email: string;
      role: string;
      isModerator: boolean;
      isSuperadmin: boolean;
    };
  }
}
