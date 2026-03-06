import React, { useState, useEffect } from 'react';
import { Part, Weapon, WEAPONS } from './assets/RefineSimulatorEquipments.ts';

type Grade = 'C' | 'B' | 'A' | 'S';

const probabilities: Record<Grade, number> = {
    C: 0.48,
    B: 0.49,
    A: 0.025,
    S: 0.005,
};

const values: Record<Grade, [number, number, number]> = {
    C: [1, 2, 3],
    B: [2, 4, 6],
    A: [3, 6, 9],
    S: [4, 8, 12],
};

const gradeImages: Record<Grade, string> = {
    C: 'https://image-bd2db.souseha.com/common/pngs/icon_C.webp',
    B: 'https://image-bd2db.souseha.com/common/pngs/icon_B.webp',
    A: 'https://image-bd2db.souseha.com/common/pngs/icon_A.webp',
    S: 'https://image-bd2db.souseha.com/common/pngs/icon_S.webp',
};

const backgrounds = {
    UR: 'https://image-bd2db.souseha.com/common/pngs/UR_rank.webp',
    SR: 'https://image-bd2db.souseha.com/common/pngs/SR_rank.webp',
    R: 'https://image-bd2db.souseha.com/common/pngs/R_rank.webp',
    N: 'https://image-bd2db.souseha.com/common/pngs/N_rank.webp',
};

const getBackground = (value: number): string => {
    if (value >= 21) return backgrounds.UR;
    if (value >= 17) return backgrounds.SR;
    if (value >= 12) return backgrounds.R;
    return backgrounds.N;
};

function GradeIcons({ grades }: { grades: string }) {
    return (
        <div className="flex gap-2 flex-wrap justify-center">
            {grades.split('').map((g, i) => (
                <img
                    key={i}
                    src={gradeImages[g as Grade]}
                    alt={g}
                    className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(180,140,70,0.6)]"
                />
            ))}
        </div>
    );
}

function ValueDisplay({ value }: { value: number }) {
    return (
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-600/15 via-red-900/25 to-transparent blur-lg" />
            <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center border-3 border-[#5c4631] shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]"
                style={{
                    backgroundImage: `url(${getBackground(value)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <span className="text-3xl font-black text-[#d4b38a] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.9)]">
                    {value}
                </span>
            </div>
        </div>
    );
}

// 儲存結構：{ [weaponName]: { maxScore: number, maxLog: string } }
type RecordEntry = { maxScore: number; maxLog: string };
type Records = Record<string, RecordEntry>;

export default function EnchantSimulator() {
    const [total, setTotal] = useState(0);
    const [history, setHistory] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [count, setCount] = useState(1);
    const [simulatedCount, setSimulatedCount] = useState(0);
    const [autoMode, setAutoMode] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showWeaponModal, setShowWeaponModal] = useState(false);

    const defaultWeapon = WEAPONS.find(w => w.name === "毒蛇之手") || WEAPONS[0];
    const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(defaultWeapon);

    // 所有裝備的最高紀錄
    const [records, setRecords] = useState<Records>(() => {
        const saved = localStorage.getItem('enchantRecords');
        return saved ? JSON.parse(saved) : {};
    });

    const [searchText, setSearchText] = useState("");
    const [partFilter, setPartFilter] = useState<Part | "全部">("全部");

    const filteredWeapons = WEAPONS.filter(w => {
        const matchSearch = w.name.toLowerCase().includes(searchText.toLowerCase());
        const matchPart = partFilter === "全部" || w.part === partFilter;
        return matchSearch && matchPart;
    });

    // 當選擇的裝備改變時，載入該裝備的紀錄
    useEffect(() => {
        const entry = records[selectedWeapon.name];
        if (entry) {
            setTotal(entry.maxScore);
            // 可以選擇是否也要載入歷史 log，這裡先不載入以保持簡潔
        } else {
            setTotal(6);
        }
    }, [selectedWeapon.name, records]);

    // 儲存紀錄到 localStorage
    useEffect(() => {
        localStorage.setItem('enchantRecords', JSON.stringify(records));
    }, [records]);

    const handleSelectWeapon = (weapon: Weapon) => {
        setSelectedWeapon(weapon);
        setShowWeaponModal(false);
    };

    const getRandomGrade = (): Grade => {
        const r = Math.random();
        if (r < probabilities.C) return 'C';
        if (r < probabilities.C + probabilities.B) return 'B';
        if (r < probabilities.C + probabilities.B + probabilities.A) return 'A';
        return 'S';
    };

    const enchant = () => {
        const grades = Array(3).fill(0).map(getRandomGrade) as Grade[];
        const [l, m, r] = grades.map((g, i) => values[g][i]);
        const added = l + m + r;
        const log = `${grades.join('')} (${l}+${m}+${r}=${added})`;

        setHistory((prev) => [log, ...prev].slice(0, 20));

        // 更新該裝備的最高紀錄
        setRecords((prev) => {

            const current = records[selectedWeapon.name] || {
                maxScore: 6,
                maxLog: 'CCC (1+2+3=6)'
            };

            if (added > current.maxScore) {
                return {
                    ...prev,
                    [selectedWeapon.name]: { maxScore: added, maxLog: log },
                };
            }
            return prev;
        });

        return added;
    };

    const startSimulation = async () => {
        setIsRunning(true);
        let i = 0;

        while (true) {
            const added = enchant();
            i++;
            setSimulatedCount((prev) => prev + 1);

            if (autoMode && added > total) {
                setTotal(added);
                break;
            }
            if (i >= count) break;

            if (i % 50 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }

        setIsRunning(false);
    };

    const reset = () => {
        // 只清除目前選擇裝備的紀錄
        setRecords((prev) => {
            const newRecords = { ...prev };
            delete newRecords[selectedWeapon.name];
            return newRecords;
        });

        // 重置當前畫面狀態
        setTotal(6);  // 因為預設是 CCC 6分
        setHistory([]);
        setIsRunning(false);
        setShowHistory(false);
        setSimulatedCount(0);
    };

    const handleCountChange = (value: number) => {
        setCount(Math.max(1, Math.min(1000, value)));
    };

    // 取得目前裝備的最高紀錄顯示用
    const currentRecord = records[selectedWeapon.name] || { maxScore: 6, maxLog: 'CCC (1+2+3=6)' };

    return (
        <div className="min-h-screen bg-[#0f0a05] text-[#d4b38a] font-serif overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(at_30%_20%,rgba(180,100,40,0.08),transparent_50%)] bg-[radial-gradient(at_70%_80%,rgba(140,40,30,0.08),transparent_60%)]" />

            <div className="relative max-w-7xl mx-auto px-4 py-4 md:py-6">
                <h1 className="text-3xl md:text-4xl font-black text-center mb-4 tracking-[2px] drop-shadow-[0_3px_8px_rgba(140,40,30,0.5)]">
                    強化等級煉製模擬器
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左側：武器展示區 */}
                    <div className="bg-[#1f1812] border-2 border-[#5c4631] rounded-2xl p-4 shadow-xl shadow-black/60">
                        <div className="text-center mb-4">
                            <div className="relative mx-auto w-32 sm:w-40">
                                <img
                                    src={selectedWeapon.thumbUrl}
                                    alt={selectedWeapon.name}
                                    className="w-full object-contain drop-shadow-[0_6px_20px_rgba(140,40,30,0.6)]"
                                />
                            </div>

                            <div className="mt-3 text-5xl md:text-6xl font-black text-[#d4b38a] tracking-tighter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                +9
                            </div>
                            <div className="mt-1 text-lg font-bold text-[#d4b38a] truncate">{selectedWeapon.name}</div>
                            <div className="text-xs text-[#8c6f4e]">{selectedWeapon.part}・UR</div>
                        </div>

                        <button
                            onClick={() => setShowWeaponModal(true)}
                            className="w-full py-3 bg-[#2b2118] hover:bg-[#3a2f23] border border-[#5c4631] rounded-xl font-bold text-base transition-all flex items-center justify-between px-4"
                        >
                            <span className="truncate">選擇裝備：{selectedWeapon.name}</span>
                            <span className="text-xl">→</span>
                        </button>

                        {/* 顯示目前裝備的歷史最高 */}
                        <div className="mt-6 pt-5 border-t border-[#5c4631]">
                            <div className="text-center">
                                <h3 className="text-base font-bold text-[#b38b4d] mb-3">歷史最高（此裝備）</h3>
                                <div className="flex flex-col items-center gap-3">
                                    <GradeIcons grades={currentRecord.maxLog.split(' ')[0] || 'CCC'} />
                                    <ValueDisplay value={currentRecord.maxScore} />
                                    <div className="font-mono text-xs bg-[#2b2118] border border-[#5c4631] px-4 py-1.5 rounded-full">
                                        {currentRecord.maxLog}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右側：控制面板 */}
                    <div className="bg-[#1f1812] border-2 border-[#5c4631] rounded-2xl p-4 shadow-xl shadow-black/60">
                        <h2 className="text-2xl font-bold text-center mb-4 text-[#d4b38a]">連續煉製</h2>

                        <div className="mb-5">
                            <label className="block text-sm text-[#b38b4d] mb-2 text-center">模擬次數（最多1000）</label>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleCountChange(count - 1)}
                                    disabled={isRunning}
                                    className="w-10 h-10 bg-[#2b2118] hover:bg-[#3a2f23] border border-[#5c4631] rounded-xl text-2xl font-bold disabled:opacity-50"
                                >
                                    −
                                </button>

                                <input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={count}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        handleCountChange(isNaN(val) ? 1 : val);
                                    }}
                                    disabled={isRunning}
                                    className="w-20 text-center bg-[#2b2118] border-2 border-[#5c4631] rounded-xl py-2 text-2xl font-black"
                                />

                                <button
                                    onClick={() => handleCountChange(count + 1)}
                                    disabled={isRunning || count >= 1000}
                                    className="w-10 h-10 bg-[#2b2118] hover:bg-[#3a2f23] border border-[#5c4631] rounded-xl text-2xl font-bold disabled:opacity-50"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="mb-5 text-center">
                            <div className="text-sm text-[#8c6f4e]">已煉製</div>
                            <div className="text-4xl font-black text-[#d4b38a]">{simulatedCount}</div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mb-5">
                            <span className="text-sm text-[#d4b38a]">自動煉製</span>
                            <button
                                onClick={() => setAutoMode(!autoMode)}
                                disabled={isRunning}
                                className={`relative h-7 w-12 rounded-full border border-[#5c4631] transition-all ${autoMode ? 'bg-[#8c2f2f]' : 'bg-[#2b2118]'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[#d4b38a] transition-all ${autoMode ? 'translate-x-5' : ''}`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <button
                                onClick={reset}
                                disabled={isRunning}
                                className="py-3 bg-[#2b2118] hover:bg-[#3a2f23] border border-[#5c4631] rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                重置此裝備紀錄
                            </button>
                            <button
                                onClick={startSimulation}
                                disabled={isRunning}
                                className={`py-3 rounded-xl font-bold text-sm border border-[#5c4631]
                  ${isRunning ? 'bg-[#3a2f23] cursor-not-allowed' : 'bg-gradient-to-r from-[#8c2f2f] to-[#b38b4d] hover:from-[#9a3a3a] hover:to-[#c49c5e]'}`}
                            >
                                {isRunning ? '進行中…' : '開始'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-[#b38b4d] hover:text-[#d4b38a] text-sm flex items-center gap-1 mx-auto"
                            >
                                {showHistory ? '隱藏' : '顯示'}紀錄 <span>{showHistory ? '▲' : '▼'}</span>
                            </button>

                            {showHistory && (
                                <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#8c2f2f]">
                                    {history.length === 0 ? (
                                        <p className="text-center text-[#8c6f4e] text-sm py-4">無紀錄</p>
                                    ) : (
                                        history.map((log, i) => (
                                            <div
                                                key={i}
                                                className="flex flex-col sm:flex-row gap-2 bg-[#2b2118] border border-[#5c4631] rounded-xl p-2 text-sm"
                                            >
                                                <GradeIcons grades={log.split(' ')[0]} />
                                                <span className="font-mono self-center truncate">{log}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showWeaponModal && (
                <div
                    className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-3"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowWeaponModal(false);
                    }}
                >
                    <div className="bg-[#1f1812] border-3 border-[#5c4631] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#5c4631] flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-[#d4b38a]">選擇裝備</h3>
                            <button
                                onClick={() => setShowWeaponModal(false)}
                                className="text-4xl leading-none text-[#8c6f4e] hover:text-[#d4b38a]"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <input
                                    type="text"
                                    placeholder="搜尋裝備名稱..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="flex-1 bg-[#1f1812] border border-[#5c4631] rounded-lg px-4 py-2.5 text-[#d4b38a] placeholder:text-[#8c6f4e] focus:outline-none focus:border-[#b38b4d] text-sm"
                                />
                                <select
                                    value={partFilter}
                                    onChange={(e) => setPartFilter(e.target.value as Part | "全部")}
                                    className="bg-[#1f1812] border border-[#5c4631] rounded-lg px-4 py-2.5 text-[#d4b38a] focus:outline-none focus:border-[#b38b4d] text-sm min-w-[120px]"
                                >
                                    <option value="全部">全部</option>
                                    <option value="武器">武器</option>
                                    <option value="盔甲">盔甲</option>
                                    <option value="頭盔">頭盔</option>
                                    <option value="手套">手套</option>
                                    <option value="飾品">飾品</option>
                                </select>
                            </div>

                            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 scrollbar-thin scrollbar-thumb-[#8c2f2f]">
                                {filteredWeapons.length === 0 ? (
                                    <p className="col-span-full text-center py-8 text-[#8c6f4e] text-sm">無符合的裝備</p>
                                ) : (
                                    filteredWeapons.map((weapon) => (
                                        <button
                                            key={weapon.name}
                                            onClick={() => handleSelectWeapon(weapon)}
                                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:-translate-y-1 ${selectedWeapon.name === weapon.name
                                                ? 'border-[#b38b4d] shadow-lg shadow-[#8c2f2f]/40 bg-[#3a2f23]'
                                                : 'border-transparent hover:border-[#8c6f4e] bg-[#1f1812]'
                                                }`}
                                        >
                                            <img
                                                src={weapon.thumbUrl}
                                                alt={weapon.name}
                                                className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent py-1.5">
                                                <p className="text-[16px] text-center font-medium text-[#d4b38a] truncate px-1">
                                                    {weapon.name}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}