import { useState } from 'react';
import { Trophy, RotateCcw, TrendingUp } from 'lucide-react';
import { GameState } from '../types/game';

interface GameOverScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

export default function GameOverScreen({
  gameState,
  onRestart,
}: GameOverScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (playerName.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 border-2 border-red-500/30 rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-red-400 mb-2 animate-pulse">
            SYSTEM FAILURE
          </h2>
          <p className="text-slate-400">Your robot has been destroyed</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Final Score</span>
            <span className="text-3xl font-bold text-cyan-300">
              {gameState.score}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Wave Reached</span>
            <span className="text-2xl font-bold text-purple-300">
              {gameState.wave}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Enemies Defeated</span>
            <span className="text-xl font-bold text-red-300">
              {Math.floor(gameState.score / 10)}
            </span>
          </div>
        </div>

        {!submitted ? (
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              Submit to Leaderboard
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your name..."
                maxLength={20}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!playerName.trim()}
                className="bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-bold">
              Score submitted successfully!
            </p>
          </div>
        )}

        <button
          onClick={onRestart}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          RESTART MISSION
        </button>
      </div>
    </div>
  );
}
