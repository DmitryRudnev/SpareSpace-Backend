import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: { 
      userId: number; 
      roles: string[] 
    };
  };
}
