export type Role = 'leader' | 'coleader' | 'member';

export interface Guild {
  id?: string;
  name: string;
  tier?: number;
  orderNum?: number;
  username?: string;
  isDisplay?: boolean;
  serial?: string | number;
  percentShown?: number;
}

export interface CostumeRecord {
  level: number; // -1 for Not Owned, 0-5 for +0 to +5
  cValue?: number; // 6-24
}

// 遊玩傾向：可複選的內容模式
export const PLAY_MODE_OPTIONS = [
  'guild_raid',   // 公會聯合戰
  'beast',        // 魔獸
  'golden_mirror',// 黃金鏡中
  'story',        // 劇情
] as const;
export type PlayMode = typeof PLAY_MODE_OPTIONS[number];

// 遊玩傾向：只能選一的投入程度
export const DEDICATION_OPTIONS = [
  'aggressive',   // 進取
  'normal',       // 平常
  'casual',       // 休閒
] as const;
export type Dedication = typeof DEDICATION_OPTIONS[number];

export interface PlayPreferences {
  modes: PlayMode[];
  dedication?: Dedication;
}

// 裝備類別（每項都記錄 23C / 24C 數量）
export interface EquipmentCategoryDef {
  key: string;
}

export const EQUIPMENT_CATEGORIES: EquipmentCategoryDef[] = [
  { key: 'universal_weapon' }, // 通用物魔武器
  { key: 'venom_serpent' },    // 毒蛇
  { key: 'blood_ring' },       // 血戒
  { key: 'blast_ornament' },   // 爆飾
  { key: 'phys_magic_glove' }, // 物魔手手
  { key: 'blast_glove' },      // 爆手手
  { key: 'other' },            // 其他
];

export interface EquipmentItem {
  c23: number; // 23C 數量
  c24: number; // 24C 數量
}

export type Equipment = Record<string, EquipmentItem>;

export interface Member {
  id?: string;
  name: string;
  guildId: string;
  role: Role;
  records: Record<string, CostumeRecord>;
  exclusiveWeapons?: Record<string, boolean>; // characterId: boolean
  equipment?: Equipment;
  playPreferences?: PlayPreferences;
  equipmentNote?: string;
  isEquipmentHidden?: boolean;
  note?: string;
  seasonNote?: string;
  overkill?: number | null;
  color?: string;
  score?: number;
  updatedAt?: number;
  status?: string;
  archiveRemark?: string;
  parentId?: string;
  isReserved?: boolean;
}

export interface Character {
  id: string;
  name: string;
  nameE?: string;
  orderNum: number;
  imageName?: string;
  gender?: string;
  atkType?: string;
  star?: string;
  attribute?: string;
}

export interface Costume {
  id: string;
  name: string;
  nameE?: string;
  characterId: string;
  imageName?: string;
  orderNum?: number;
  isNew?: boolean;
}

export interface User {
  username: string;
  role: 'creator' | 'admin' | 'manager' | 'member';
}

export interface Setting {
  id: string;
  bgmUrl?: string;
  bgmDefaultVolume?: number;
  indexMessage?: string;
  indexPercentType?: 'empty' | 'new_costumes_owned';
  isDebugMode?: boolean;
  applicationPendingCount?: number;
}

export interface ApplyMail {
  id: string;
  createdAt: string;
  subject: string;
  content: string;
  status: string;
  loginId: string;
}

export interface AccessControl {
  page: string;
  roles: ('member' | 'manager' | 'admin' | 'creator')[];
}

export interface Database {
  guilds: Record<string, Guild>;
  guildOrder?: string[];
  members: Record<string, Member>;
  characters: Record<string, Character>;
  costumes: Record<string, Costume>;
  settings: Record<string, Setting>;
  applyMails: Record<string, ApplyMail>;
  accessControl: Record<string, AccessControl>;
}
export interface ArchiveHistory {
  id: string;
  memberId: string;
  fromGuildId: string;
  archiveReason: string;
  archivedAt: string;
  guilds: {
    name: string;
  };
}

export interface ArchivedMember {
  id: string;
  name: string;
  status: string;
  archiveRemark: string;
  membersArchiveHistory: ArchiveHistory[];
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type GuildWithMembers = Guild & {
  members: Member[];
};

export type TieredData = {
  tier: number;
  guilds: GuildWithMembers[];
};