import bcrypt from 'bcryptjs';
import { createClient } from './supabase/client';
import { Database } from '@/database.types';

export type UserRole = 'owner' | 'admin' | 'promoter' | 'user';

export interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  badge_type: 'owner' | 'admin' | 'promoter' | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Client-side functions only
export async function createUser(username: string, password: string, email?: string, phone?: string): Promise<User> {
  const supabase = createClient();
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      email: email || null,
      phone: phone || null,
      role: 'user'
    })
    .select()
    .single();
    
  if (error) throw error;
  // Strip password_hash
  const { password_hash, ...userWithoutHash } = data as unknown as { password_hash: string } & User;
  return userWithoutHash;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
    
  if (error || !data) return null;
  
  const isValid = await verifyPassword(password, (data as { password_hash: string }).password_hash);
  if (!isValid) return null;
  
  const { password_hash, ...user } = data as unknown as { password_hash: string } & User;
  return user;
}

export function getBadgeType(role: UserRole): 'owner' | 'admin' | 'promoter' | null {
  switch (role) {
    case 'owner':
      return 'owner';
    case 'admin':
      return 'admin';
    case 'promoter':
      return 'promoter';
    default:
      return null;
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    'user': 0,
    'promoter': 1,
    'admin': 2,
    'owner': 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageEvents(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin');
}

export function canCreateEvents(userRole: UserRole): boolean {
  return hasPermission(userRole, 'promoter');
}

export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}

export function canViewSupportInbox(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin');
}
