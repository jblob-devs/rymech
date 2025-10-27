import { Player } from '../types/game';
import { Package } from 'lucide-react';

interface ResourceTrackerProps {
  player: Player;
}

export default function ResourceTracker({ player }: ResourceTrackerProps) {
  const resources = [
    { name: 'Energy', value: player.resources.energy, color: '#60a5fa' },
    { name: 'Core Dust', value: player.resources.coreDust, color: '#a78bfa' },
    { name: 'Flux', value: player.resources.flux, color: '#c084fc' },
    { name: 'Geo Shards', value: player.resources.geoShards, color: '#22d3ee' },
    { name: 'Alloy Fragments', value: player.resources.alloyFragments, color: '#94a3b8' },
    { name: 'Singularity Core', value: player.resources.singularityCore, color: '#fbbf24' },
    { name: 'Cryo Kelp', value: player.resources.cryoKelp, color: '#7dd3fc' },
    { name: 'Obsidian Heart', value: player.resources.obsidianHeart, color: '#fb923c' },
    { name: 'Gloom Root', value: player.resources.gloomRoot, color: '#a3e635' },
    { name: 'Resonant Crystal', value: player.resources.resonantCrystal, color: '#22d3ee' },
    { name: 'Void Essence', value: player.resources.voidEssence, color: '#c084fc' },
    { name: 'Bioluminescent Pearl', value: player.resources.bioluminescentPearl, color: '#5eead4' },
    { name: 'Sunpetal Bloom', value: player.resources.sunpetalBloom, color: '#fde047' },
    { name: 'Aetherium Shard', value: player.resources.aetheriumShard, color: '#a5b4fc' },
    { name: 'Void Core', value: player.resources.voidCore, color: '#7c3aed' },
  ].filter(resource => resource.value > 0);

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 pointer-events-none select-none">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300">RESOURCES</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-64 overflow-y-auto">
          {resources.map((resource) => (
            <div key={resource.name} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate">{resource.name}</span>
              <span className="font-bold ml-2" style={{ color: resource.color }}>
                {resource.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
