import { X, MapPin, Zap, Package2, Navigation } from 'lucide-react';
import { PlanarAnchor } from '../types/game';

interface AnchorInteractionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: PlanarAnchor | null;
  activatedAnchors: PlanarAnchor[];
  onSetRespawn: () => void;
  onOpenVault: () => void;
  onTeleport: (anchorId: string) => void;
}

export function AnchorInteractionMenu({
  isOpen,
  onClose,
  anchor,
  activatedAnchors,
  onSetRespawn,
  onOpenVault,
  onTeleport,
}: AnchorInteractionMenuProps) {
  if (!isOpen || !anchor) return null;

  const isBaseCamp = anchor.type === 'base_camp';
  const isRespawnPoint = anchor.isSetAsRespawn;
  const otherAnchors = activatedAnchors.filter(a => a.id !== anchor.id);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border-2 border-blue-500 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <MapPin size={28} />
            {isBaseCamp ? 'Base Camp' : 'Planar Anchor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {!isRespawnPoint && (
            <button
              onClick={() => {
                onSetRespawn();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-600 hover:bg-yellow-500 rounded text-white font-semibold transition-colors"
            >
              <Zap size={20} />
              <span>Set as Respawn Point</span>
            </button>
          )}

          {isRespawnPoint && (
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-800 rounded text-yellow-200 font-semibold">
              <Zap size={20} />
              <span>Current Respawn Point</span>
            </div>
          )}

          {isBaseCamp && (
            <button
              onClick={() => {
                onOpenVault();
                // Don't call onClose - the vault will handle pausing
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded text-white font-semibold transition-colors"
            >
              <Package2 size={20} />
              <span>Access Vault</span>
            </button>
          )}

          {otherAnchors.length > 0 && (
            <>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                  <Navigation size={16} />
                  Teleport to Anchor
                </h3>
                <div className="space-y-2">
                  {otherAnchors.map((targetAnchor) => (
                    <button
                      key={targetAnchor.id}
                      onClick={() => {
                        onTeleport(targetAnchor.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-white transition-colors"
                    >
                      <span className="text-sm font-mono">
                        {targetAnchor.type === 'base_camp' ? '🏠 Base Camp' : '⚓ Field Anchor'}
                      </span>
                      {targetAnchor.isSetAsRespawn && (
                        <span className="text-yellow-300 text-xs">⚡ Respawn</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
