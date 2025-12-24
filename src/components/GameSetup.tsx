import React, { useState } from 'react';
import { Users, Crown, Play, Clock, DollarSign, Settings, User, Bot, Copy, Check } from 'lucide-react';
import { MultiplayerGameState } from '../hooks/useMultiplayer';

interface GameSetupProps {
  gameState: MultiplayerGameState;
  currentPlayerId: string | null;
  onStartGame: (gameDuration: number, startMoney: number) => void;
  onLeaveRoom: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  gameState,
  currentPlayerId,
  onStartGame,
  onLeaveRoom
}) => {
  const [gameDuration, setGameDuration] = useState<number>(-1);
  const [startMoney, setStartMoney] = useState<number>(1500);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  const isHost = gameState.hostId === currentPlayerId;
  const canStart = isHost && gameState.players.length >= 2;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(gameState.roomCode);
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleStartGame = () => {
    if (canStart) {
      onStartGame(gameDuration, startMoney);
    }
  };

  const availableDurations = [
    { value: -1, label: 'আনলিমিটেড' },
    { value: 15, label: '১৫ মিনিট' },
    { value: 30, label: '৩০ মিনিট' },
    { value: 45, label: '৪৫ মিনিট' },
    { value: 60, label: '১ ঘন্টা' },
  ];

  const moneyOptions = [1000, 1500, 2000, 2500, 3000];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white font-['Hind_Siliguri'] p-4">
      <div className="w-full max-w-4xl bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-black">রুম প্রস্তুতি</h1>
          </div>
          
          {/* Room Code */}
          <div className="inline-flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-600">
            <span className="text-slate-400">রুম কোড:</span>
            <span className="text-xl font-mono font-bold tracking-wider text-blue-400">
              {gameState.roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              className="p-1 hover:bg-slate-700 rounded transition"
              title="কপি করুন"
            >
              {copiedRoomCode ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Players List */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={20} />
              খেলোয়াড় ({gameState.players.length}/4)
            </h2>
            
            <div className="space-y-3">
              {gameState.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition ${
                    index === gameState.currentPlayerIndex
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.isAi ? (
                        <Bot size={20} className="text-white" />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {player.name}
                        {player.id === gameState.hostId && (
                          <Crown size={16} className="text-yellow-500" title="হোস্ট" />
                        )}
                        {player.id === currentPlayerId && (
                          <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">আপনি</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {player.isAi ? 'কম্পিউটার' : 'মানুষ'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono text-green-400">৳{player.money}</div>
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: 4 - gameState.players.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-600 bg-slate-800/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <Users size={20} className="text-slate-600" />
                    </div>
                    <div className="text-slate-500">অপেক্ষমান খেলোয়াড়...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Settings */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings size={20} />
              খেলার সেটিংস
            </h2>
            
            <div className="space-y-6">
              {/* Game Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  খেলার সময়সীমা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableDurations.map((duration) => (
                    <button
                      key={duration.value}
                      onClick={() => setGameDuration(duration.value)}
                      className={`py-2 px-3 rounded-lg text-sm transition ${
                        gameDuration === duration.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starting Money */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  শুরুর টাকা
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {moneyOptions.map((money) => (
                    <button
                      key={money}
                      onClick={() => setStartMoney(money)}
                      className={`py-2 px-3 rounded-lg text-sm transition ${
                        startMoney === money
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      ৳{money}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host Instructions */}
              {isHost ? (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={16} className="text-yellow-500" />
                    <span className="font-medium text-blue-200">আপনি হোস্ট</span>
                  </div>
                  <p className="text-blue-100 text-sm">
                    অন্তত ২ জন খেলোয়াড় অপেক্ষা করছে। খেলা শুরু করতে নিচের বাটনে ক্লিক করুন।
                  </p>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-300">অপেক্ষা করুন</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    হোস্ট খেলা শুরু করার অপেক্ষা করছেন...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onLeaveRoom}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  রুম ছেড়ে যান
                </button>
                
                <button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className={`flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                    canStart
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={18} />
                  খেলা শুরু করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};