import React, { useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Download, Upload, Save, Trash2 } from 'lucide-react';

interface SaveMenuProps {
  gameEngine: GameEngine | null;
  onClose: () => void;
}

export function SaveMenu({ gameEngine, onClose }: SaveMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (gameEngine) {
      const success = gameEngine.saveGame();
      if (success) {
        alert('Game saved successfully!');
      } else {
        alert('Failed to save game.');
      }
    }
  };

  const handleExport = () => {
    if (gameEngine) {
      gameEngine.exportSaveToFile();
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && gameEngine) {
      const success = await gameEngine.importSaveFromFile(file);
      if (success) {
        alert('Save file imported successfully! Reloading game...');
        window.location.reload();
      } else {
        alert('Failed to import save file. Please check the file format.');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteSave = () => {
    if (gameEngine) {
      const confirmed = confirm('Are you sure you want to delete your save data? This cannot be undone!');
      if (confirmed) {
        const success = gameEngine.deleteSaveData();
        if (success) {
          alert('Save data deleted. Reloading game...');
          window.location.reload();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Save Management</h2>
        
        <div className="space-y-3">
          <button
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-semibold transition-colors"
          >
            <Save size={20} />
            <span>Save Game</span>
          </button>

          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition-colors"
          >
            <Download size={20} />
            <span>Export Save File</span>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-500 rounded text-white font-semibold transition-colors"
          >
            <Upload size={20} />
            <span>Import Save File</span>
          </button>

          <button
            onClick={handleDeleteSave}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-500 rounded text-white font-semibold transition-colors"
          >
            <Trash2 size={20} />
            <span>Delete Save Data</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">
            Your progress is automatically saved every 30 seconds.
          </p>
          <p className="text-xs text-slate-500">
            Export your save file as a backup or to transfer to another device/browser.
          </p>
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
