import React from 'react';

interface ResourceIconProps {
  resourceType: string;
  size?: number;
}

export default function ResourceIcon({ resourceType, size = 24 }: ResourceIconProps) {
  const renderIcon = () => {
    switch (resourceType) {
      case 'energy':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#3b82f6" stroke="#1e40af" strokeWidth="2"/>
          </svg>
        );

      case 'coreDust':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="8" r="2" fill="#a855f7"/>
            <circle cx="16" cy="10" r="1.5" fill="#9333ea"/>
            <circle cx="12" cy="14" r="2.5" fill="#c084fc"/>
            <circle cx="18" cy="16" r="1.5" fill="#a855f7"/>
            <circle cx="10" cy="18" r="2" fill="#9333ea"/>
          </svg>
        );

      case 'flux':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 8v8l10 6 10-6V8l-10-6z" fill="#06b6d4" stroke="#0891b2" strokeWidth="2"/>
            <path d="M12 8L7 11v6l5 3 5-3v-6l-5-3z" fill="#67e8f9"/>
          </svg>
        );

      case 'geoShards':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 3L15 9L21 12L15 15L12 21L9 15L3 12L9 9z" fill="#d97706" stroke="#92400e" strokeWidth="2"/>
            <path d="M12 8L14 12L12 16L10 12z" fill="#fbbf24"/>
          </svg>
        );

      case 'alloyFragments':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="6" height="8" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
            <rect x="11" y="10" width="6" height="6" fill="#9ca3af" stroke="#4b5563" strokeWidth="2"/>
            <rect x="8" y="14" width="5" height="6" fill="#6b7280" stroke="#374151" strokeWidth="2"/>
          </svg>
        );

      case 'singularityCore':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" fill="#ec4899" stroke="#be185d" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" fill="#f9a8d4"/>
            <circle cx="12" cy="12" r="2" fill="#fce7f3"/>
          </svg>
        );

      case 'cryoKelp':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C10 6 8 10 8 14c0 2 1 4 4 6 3-2 4-4 4-6 0-4-2-8-4-12z" fill="#2dd4bf" stroke="#0f766e" strokeWidth="2"/>
            <path d="M10 8c-2 2-3 4-3 6 0 1.5 0.5 2.5 2 3.5M14 8c2 2 3 4 3 6 0 1.5-0.5 2.5-2 3.5" stroke="#99f6e4" strokeWidth="1.5"/>
          </svg>
        );

      case 'obsidianHeart':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 21l-1.5-1.4C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.9 4.5 2.3C13.1 3.9 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.1L12 21z" fill="#7f1d1d" stroke="#450a0a" strokeWidth="2"/>
            <path d="M12 7c-1-1.5-2-2-3.5-2C7 5 6 6 6 7.5c0 2.5 2 4.5 6 8 4-3.5 6-5.5 6-8C18 6 17 5 15.5 5 14 5 13 5.5 12 7z" fill="#991b1b"/>
          </svg>
        );

      case 'gloomRoot':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2v8M12 10c-2 0-4 2-4 4v6M12 10c2 0 4 2 4 4v6M8 16c-2 0-3 1-3 2v2M16 16c2 0 3 1 3 2v2" stroke="#4338ca" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="2" r="2" fill="#6366f1"/>
            <circle cx="8" cy="14" r="1.5" fill="#4338ca"/>
            <circle cx="16" cy="14" r="1.5" fill="#4338ca"/>
          </svg>
        );

      case 'resonantCrystal':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L6 8l6 6 6-6-6-6z" fill="#c084fc" stroke="#7e22ce" strokeWidth="2"/>
            <path d="M6 8l6 6v8l-6-6V8z" fill="#a855f7" stroke="#7e22ce" strokeWidth="2"/>
            <path d="M18 8l-6 6v8l6-6V8z" fill="#d8b4fe" stroke="#7e22ce" strokeWidth="2"/>
          </svg>
        );

      case 'voidEssence':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="#581c87" stroke="#3b0764" strokeWidth="2"/>
            <path d="M12 6c-3 0-5 2-5 5 0 1.5 0.7 3 2 4M12 6c3 0 5 2 5 5 0 1.5-0.7 3-2 4" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="10" r="1.5" fill="#a78bfa"/>
            <circle cx="15" cy="10" r="1.5" fill="#a78bfa"/>
          </svg>
        );

      case 'bioluminescentPearl':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="7" fill="#7dd3fc" stroke="#0369a1" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" fill="#bae6fd"/>
            <circle cx="10" cy="10" r="2" fill="#e0f2fe"/>
          </svg>
        );

      case 'sunpetalBloom':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#fbbf24"/>
            <path d="M12 5v3M12 16v3M5 12h3M16 12h3M7.75 7.75l2.12 2.12M14.13 14.13l2.12 2.12M7.75 16.25l2.12-2.12M14.13 9.87l2.12-2.12" stroke="#facc15" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );

      case 'aetheriumShard':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 3L18 9L15 12L21 18L12 21L3 18L9 12L6 9z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2"/>
            <path d="M12 8L15 12L12 16L9 12z" fill="#7dd3fc"/>
          </svg>
        );

      case 'gravitonEssence':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2" fill="#c026d3"/>
            <circle cx="12" cy="12" r="5" stroke="#c026d3" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="8" stroke="#c026d3" strokeWidth="1.5" fill="none" opacity="0.5"/>
            <circle cx="8" cy="8" r="1.5" fill="#e879f9"/>
            <circle cx="16" cy="8" r="1.5" fill="#e879f9"/>
            <circle cx="8" cy="16" r="1.5" fill="#e879f9"/>
            <circle cx="16" cy="16" r="1.5" fill="#e879f9"/>
          </svg>
        );

      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" fill="#6b7280" stroke="#374151" strokeWidth="2" rx="2"/>
          </svg>
        );
    }
  };

  return <div className="flex items-center justify-center">{renderIcon()}</div>;
}
