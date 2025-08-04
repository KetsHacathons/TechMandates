import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory session storage (in a real app, you'd use a proper session store)
const sessions = new Map<string, any>();
const users = new Map<string, any>();

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at: number;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: any;
}

export interface AuthStateChangeCallback {
  (event: string, session: Session | null): void;
}

class SQLiteAuth {
  private listeners: AuthStateChangeCallback[] = [];

  async signUp(email: string, password: string) {
    try {
      // Check if user already exists
      const existingUser = users.get(email);
      if (existingUser) {
        return { error: { message: 'User already exists' } };
      }

      // Create new user
      const userId = uuidv4();
      const user: User = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.set(email, { ...user, password }); // In real app, hash the password

      // Create profile
      const profileId = uuidv4();
      db.prepare(`
        INSERT INTO profiles (id, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(profileId, userId, user.created_at, user.updated_at);

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      const userData = users.get(email);
      if (!userData || userData.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        };
      }

      const { password: _, ...user } = userData;
      const session = this.createSession(user);

      return {
        data: { user, session },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error
      };
    }
  }

  async signOut() {
    // Clear current session
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      sessions.delete(currentSession.access_token);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener('SIGNED_OUT', null));
  }

  async getSession(): Promise<AuthResponse> {
    // In a real app, you'd validate the session token
    const currentSession = this.getCurrentSession();
    return {
      data: { 
        user: currentSession?.user || null, 
        session: currentSession || null 
      },
      error: null
    };
  }

  async getUser(token: string): Promise<AuthResponse> {
    const session = sessions.get(token);
    return {
      data: { 
        user: session?.user || null, 
        session: session || null 
      },
      error: null
    };
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    this.listeners.push(callback);
    
    // Return subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          }
        }
      }
    };
  }

  private createSession(user: User): Session {
    const access_token = uuidv4();
    const refresh_token = uuidv4();
    const expires_at = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    const session: Session = {
      access_token,
      refresh_token,
      user,
      expires_at
    };

    sessions.set(access_token, session);
    
    // Store token in localStorage for persistence
    localStorage.setItem('sqlite_access_token', access_token);
    
    // Notify listeners
    this.listeners.forEach(listener => listener('SIGNED_IN', session));
    
    return session;
  }

  private getCurrentSession(): Session | null {
    const token = localStorage.getItem('sqlite_access_token');
    if (!token) return null;
    
    const session = sessions.get(token);
    if (!session || session.expires_at < Date.now()) {
      sessions.delete(token);
      localStorage.removeItem('sqlite_access_token');
      return null;
    }
    
    return session;
  }
}

class SQLiteClient {
  public auth: SQLiteAuth;

  constructor() {
    this.auth = new SQLiteAuth();
  }

  // Real-time subscriptions (simplified)
  channel(channelName: string) {
    return new SQLiteChannel(channelName);
  }

  removeChannel(channel: SQLiteChannel) {
    channel.unsubscribe();
  }

  // Database operations
  from(table: string) {
    return new SQLiteTable(table);
  }

  // Function invocations (simplified for local operations)
  functions = {
    invoke: async (functionName: string, options: { body: any }) => {
      const { localFunctions } = await import('./functions');
      
      if (localFunctions[functionName]) {
        return await localFunctions[functionName](options.body);
      }
      
      console.warn(`Function ${functionName} not implemented`);
      return {
        data: { success: true },
        error: null
      };
    }
  };
}

class SQLiteTable {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    return new SQLiteQuery(this.tableName, 'SELECT', columns);
  }

  insert(data: any) {
    return new SQLiteQuery(this.tableName, 'INSERT', data);
  }

  update(data: any) {
    return new SQLiteQuery(this.tableName, 'UPDATE', data);
  }

  delete() {
    return new SQLiteQuery(this.tableName, 'DELETE');
  }

  eq(column: string, value: any) {
    return new SQLiteQuery(this.tableName, 'SELECT', '*').eq(column, value);
  }

  in(column: string, values: any[]) {
    return new SQLiteQuery(this.tableName, 'SELECT', '*').in(column, values);
  }

  limit(count: number) {
    return new SQLiteQuery(this.tableName, 'SELECT', '*').limit(count);
  }

  single() {
    return new SQLiteQuery(this.tableName, 'SELECT', '*').single();
  }
}

class SQLiteQuery {
  private tableName: string;
  private operation: string;
  private data: any;
  private conditions: Array<{ column: string; operator: string; value: any }> = [];
  private limitCount?: number;
  private singleResult = false;

  constructor(tableName: string, operation: string, data?: any) {
    this.tableName = tableName;
    this.operation = operation;
    this.data = data;
  }

  eq(column: string, value: any) {
    this.conditions.push({ column, operator: '=', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.conditions.push({ column, operator: 'IN', value: values });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async run() {
    try {
      let sql = '';
      let params: any[] = [];

      switch (this.operation) {
        case 'SELECT':
          sql = `SELECT ${this.data} FROM ${this.tableName}`;
          if (this.conditions.length > 0) {
            const whereClause = this.conditions.map((condition, index) => {
              if (condition.operator === 'IN') {
                const placeholders = condition.value.map(() => '?').join(',');
                params.push(...condition.value);
                return `${condition.column} IN (${placeholders})`;
              } else {
                params.push(condition.value);
                return `${condition.column} ${condition.operator} ?`;
              }
            }).join(' AND ');
            sql += ` WHERE ${whereClause}`;
          }
          if (this.limitCount) {
            sql += ` LIMIT ${this.limitCount}`;
          }
          
          const stmt = db.prepare(sql);
          const results = stmt.all(params);
          
          return {
            data: this.singleResult ? results[0] || null : results,
            error: null
          };

        case 'INSERT':
          const columns = Object.keys(this.data);
          const values = Object.values(this.data);
          const placeholders = columns.map(() => '?').join(',');
          sql = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${placeholders})`;
          
          const insertStmt = db.prepare(sql);
          const result = insertStmt.run(values);
          
          return {
            data: result,
            error: null
          };

        case 'UPDATE':
          const updateColumns = Object.keys(this.data);
          const updateValues = Object.values(this.data);
          const setClause = updateColumns.map(col => `${col} = ?`).join(',');
          sql = `UPDATE ${this.tableName} SET ${setClause}`;
          
          if (this.conditions.length > 0) {
            const whereClause = this.conditions.map(condition => {
              params.push(condition.value);
              return `${condition.column} ${condition.operator} ?`;
            }).join(' AND ');
            sql += ` WHERE ${whereClause}`;
          }
          
          const updateStmt = db.prepare(sql);
          const updateResult = updateStmt.run([...updateValues, ...params]);
          
          return {
            data: updateResult,
            error: null
          };

        case 'DELETE':
          sql = `DELETE FROM ${this.tableName}`;
          if (this.conditions.length > 0) {
            const whereClause = this.conditions.map(condition => {
              params.push(condition.value);
              return `${condition.column} ${condition.operator} ?`;
            }).join(' AND ');
            sql += ` WHERE ${whereClause}`;
          }
          
          const deleteStmt = db.prepare(sql);
          const deleteResult = deleteStmt.run(params);
          
          return {
            data: deleteResult,
            error: null
          };

        default:
          throw new Error(`Unsupported operation: ${this.operation}`);
      }
    } catch (error) {
      return {
        data: null,
        error
      };
    }
  }
}

class SQLiteChannel {
  private channelName: string;
  private listeners: Map<string, Function[]> = new Map();

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return this;
  }

  subscribe() {
    // In a real implementation, you'd set up polling or WebSocket connection
    console.log(`Subscribed to channel: ${this.channelName}`);
    return this;
  }

  unsubscribe() {
    this.listeners.clear();
    console.log(`Unsubscribed from channel: ${this.channelName}`);
  }

  // Method to trigger events (for testing/mocking)
  trigger(event: string, payload: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(payload));
    }
  }
}

// Create and export the SQLite client
export const sqlite = new SQLiteClient();

// Export types for compatibility
export type { User, Session, AuthResponse }; 