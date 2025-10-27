import { useEffect, useState } from 'react';
import { Trophy, X, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  created_at?: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

const getLeaderboard = async (_limit: number): Promise<LeaderboardEntry[]> => {
  return [];
};

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getLeaderboard(10);
    setEntries(data);
    setLoading(false);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-slate-300';
    if (index === 2) return 'text-orange-400';
    return 'text-slate-500';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/30 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 p-4 flex items-center justify-between border-b border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-yellow-300">
              GLOBAL LEADERBOARD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
          >
            <X className="w-6 h-6 text-red-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No entries yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    index < 3
                      ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-yellow-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div
                    className={`text-3xl font-bold w-12 text-center ${getMedalColor(
                      index
                    )}`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">
                      {entry.player_name}
                    </div>
                    <div className="text-sm text-slate-400">
                      Wave {entry.wave}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-300">
                      {entry.score}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.created_at || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
