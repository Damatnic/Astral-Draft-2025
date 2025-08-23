/**
 * League room handler for real-time league features
 */

import { Server } from 'socket.io';

interface LeagueUser {
  userId: string;
  username: string;
  teamId?: string;
  socket: any;
}

export class LeagueRoom {
  private io: Server;
  private leagueId: string;
  private users: Map<string, LeagueUser> = new Map();
  
  constructor(io: Server, leagueId: string) {
    this.io = io;
    this.leagueId = leagueId;
  }
  
  async addUser(socket: any) {
    const user: LeagueUser = {
      userId: socket.userId,
      username: socket.username,
      teamId: socket.teamId,
      socket,
    };
    
    this.users.set(socket.userId, user);
    
    // Notify other users
    this.broadcast('user:online', {
      userId: user.userId,
      username: user.username,
    }, socket.userId);
  }
  
  removeUser(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.broadcast('user:offline', {
        userId,
        username: user.username,
      });
    }
  }
  
  getMembers() {
    return Array.from(this.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      teamId: u.teamId,
    }));
  }
  
  isEmpty(): boolean {
    return this.users.size === 0;
  }
  
  private broadcast(event: string, data: any, excludeUserId?: string) {
    this.users.forEach((user) => {
      if (user.userId !== excludeUserId) {
        user.socket.emit(event, data);
      }
    });
  }
}