export type Role = '會長' | '副會長' | '成員';

export interface Guild {
  id?: string;
  name: string;
  tier?: number;
  order_num?: number;
}

export interface CostumeRecord {
  level: number; // -1 for Not Owned, 0-5 for +0 to +5
  cValue?: number; // 6-24
}

export interface Member {
  id?: string;
  name: string;
  guild_id: string;
  role: Role;
  records: Record<string, CostumeRecord>;
  exclusive_weapons?: Record<string, boolean>; // characterId: boolean
  note?: string;
  updated_at?: number;
}

export interface Character {
  id: string;
  name: string;
  order_num: number;
  image_name?: string;
}

export interface Costume {
  id: string;
  name: string;
  character_id: string;
  image_name?: string;
  order_num?: number;
  is_new?: boolean;
}

export interface User {
  username: string;
  password: string;
  role: 'creator' | 'admin' | 'manager';
}

export interface Database {
  guilds: Record<string, Guild>;
  guildOrder?: string[];
  members: Record<string, Member>;
  characters: Record<string, Character>;
  costumes: Record<string, Costume>;
  users: Record<string, User>;
  settings: {
    site_password?: string;
    redirect_url?: string;
  };
}
