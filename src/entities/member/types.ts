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

// 裝備類別（每項都記錄 23C / 24C 數量；icon = 代表圖示 thumb URL，icons = 該欄位涵蓋的所有裝備圖示）
export interface EquipmentCategoryDef {
  key: string;
  icon: string;
  icons?: { thumb: string; name: string }[];
}

const WEAPONS_THUMB = (id: string) => `https://image-bd2db.souseha.com/weapons_new/thumbs/${id}_thumb.webp`;

export const EQUIPMENT_CATEGORIES: EquipmentCategoryDef[] = [
  {
    key: 'phys_weapon',
    icon: WEAPONS_THUMB('icon_equipment4101_61'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4101_61'), name: '惡龍的魔劍' },
      { thumb: WEAPONS_THUMB('icon_equipment4102_62'), name: '雷霆槌子' },
      { thumb: WEAPONS_THUMB('icon_equipment4103_63'), name: '必中之矛' },
    ],
  },
  {
    key: 'magic_weapon',
    icon: WEAPONS_THUMB('icon_equipment4104_64'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4104_64'), name: '旅行之神的摯友' },
      { thumb: WEAPONS_THUMB('icon_equipment4105_65'), name: '毀滅者之眼' },
      { thumb: WEAPONS_THUMB('icon_equipment4106_66'), name: '魔王的禁書' },
    ],
  },
  {
    key: 'ur_exclusive',
    icon: WEAPONS_THUMB('icon_equipment201_21'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment201_21'), name: '皇家石' },
    ],
  },
  {
    key: 'venom_serpent',
    icon: WEAPONS_THUMB('icon_equipment4504_88'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4504_88'), name: '毒蛇之手' },
    ],
  },
  {
    key: 'life_crit_dmg',
    icon: WEAPONS_THUMB('icon_equipment4505_89'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4505_89'), name: '湖水戒指' },
      { thumb: WEAPONS_THUMB('icon_equipment4506_90'), name: '魅惑之眼' },
    ],
  },
  {
    key: 'life_crit_rate',
    icon: WEAPONS_THUMB('icon_equipment4502_86'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4502_86'), name: '美學之巔' },
      { thumb: WEAPONS_THUMB('icon_equipment4503_87'), name: '調和之約' },
    ],
  },
  {
    key: 'phys_glove',
    icon: WEAPONS_THUMB('icon_equipment4201_79'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4201_79'), name: '神王的銀臂' },
      { thumb: WEAPONS_THUMB('icon_equipment4203_81'), name: '主神的威嚴' },
    ],
  },
  {
    key: 'magic_glove',
    icon: WEAPONS_THUMB('icon_equipment4206_84'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4206_84'), name: '背叛的束縛' },
      { thumb: WEAPONS_THUMB('icon_equipment4205_83'), name: '守護的龍鱗' },
    ],
  },
  {
    key: 'phys_crit_glove',
    icon: WEAPONS_THUMB('icon_equipment4202_80'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4202_80'), name: '造反的決心' },
    ],
  },
  {
    key: 'magic_crit_glove',
    icon: WEAPONS_THUMB('icon_equipment4204_82'),
    icons: [
      { thumb: WEAPONS_THUMB('icon_equipment4204_82'), name: '憤怒之環' },
    ],
  },
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