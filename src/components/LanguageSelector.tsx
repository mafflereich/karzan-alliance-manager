// src/components/LanguageSelector.tsx
import React, { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { languages, Language } from '../i18n/languages';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    // 目前選中的語言
    const currentCode = i18n.language || i18n.options.fallbackLng?.[0] || 'zh-TW';
    const selected = languages.find(l => l.code === currentCode) || languages[0];

    const handleChange = (lang: Language) => {
        i18n.changeLanguage(lang.code);
        localStorage.setItem('preferredLanguage', lang.code);
    };

    return (
        <Listbox value={selected} onChange={handleChange}>
            <div className="relative w-48 sm:w-56">
                {/* 觸發按鈕 */}
                <ListboxButton
                    className={`
            relative w-full cursor-pointer rounded-lg
            bg-stone-900 text-white
            py-2.5 pl-4 pr-10 text-left
            shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60
            transition-all duration-200
            hover:bg-stone-800 hover:border-stone-600
          `}
                >
                    <span className="block truncate font-medium">
                        {selected.nativeName}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                </ListboxButton>

                {/* 展開選單 + 動畫 */}
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ListboxOptions
                        as={motion.ul}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={true}
                        className={`
              absolute z-50 mt-1 w-full overflow-auto
              rounded-lg bg-stone-900 border-stone-700
              py-1 text-base shadow-2xl shadow-black/50
              max-h-72
            `}
                    >
                        {languages.map((lang) => (
                            <ListboxOption
                                key={lang.code}
                                value={lang}
                                className={({ active, selected }) =>
                                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4
                  transition-colors duration-150
                  ${active ? 'bg-stone-800 text-white' : 'text-white'}
                  ${selected ? 'font-medium' : 'font-normal'}`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {lang.nativeName}
                                        </span>
                                        {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Transition>
            </div>
        </Listbox>
    );
};

export default LanguageSelector;