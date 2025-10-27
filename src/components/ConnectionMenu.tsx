import { useState } from 'react';
import { Users, Copy, Check, X } from 'lucide-react';

interface ConnectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: () => Promise<string>;
  onJoinGame: (hostId: string) => Promise<void>;
  isConnected: boolean;
  connectionCount: number;
  peerId: string;
  role: 'host' | 'client' | 'none';
}

export default function ConnectionMenu({
  isOpen,
  onClose,
  onCreateGame,
  onJoinGame,
  isConnected,
  connectionCount,
  peerId,
  role,
}: ConnectionMenuProps) {
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateGame = async () => {
    setIsCreating(true);
    setError('');
    try {
      await onCreateGame();
    } catch (err) {
      setError('Failed to create game: ' + (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinId.trim()) {
      setError('Please enter a game ID');
      return;
    }
    
    setIsJoining(true);
    setError('');
    try {
      await onJoinGame(joinId.trim());
    } catch (err) {
      setError('Failed to join game: ' + (err as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-cyan-300">MULTIPLAYER</h1>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-semibold">
                  {role === 'host' ? 'HOSTING GAME' : 'CONNECTED'}
                </span>
              </div>
              {role === 'host' && (
                <p className="text-slate-300 text-sm">
                  {connectionCount} player{connectionCount !== 1 ? 's' : ''} connected
                </p>
              )}
            </div>

            {role === 'host' && peerId && (
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <p className="text-slate-400 text-xs mb-2">Share this ID with your friend:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={peerId}
                    readOnly
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-cyan-300 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            )}

            <p className="text-slate-400 text-sm text-center mt-4">
              Close this menu to start playing together!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <button
                onClick={handleCreateGame}
                disabled={isCreating || isJoining}
                className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded font-bold text-white transition-colors"
              >
                {isCreating ? 'CREATING...' : 'CREATE GAME'}
              </button>
              <p className="text-slate-400 text-xs mt-2 text-center">
                Host a game and share the ID with a friend
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <div>
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Enter Game ID"
                disabled={isCreating || isJoining}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white mb-2 disabled:opacity-50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinGame();
                  }
                }}
              />
              <button
                onClick={handleJoinGame}
                disabled={isCreating || isJoining || !joinId.trim()}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded font-bold text-white transition-colors"
              >
                {isJoining ? 'JOINING...' : 'JOIN GAME'}
              </button>
              <p className="text-slate-400 text-xs mt-2 text-center">
                Join a friend's game using their ID
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
