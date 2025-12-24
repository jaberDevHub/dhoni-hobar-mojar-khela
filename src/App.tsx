import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, SquareType, LogEntry } from './types';
import { INITIAL_SQUARES, PLAYER_COLORS, CHANCE_CARDS, COMMUNITY_CARDS } from './constants';
import { Board } from './components/Board';
import {
  User, Dice5, Home, Play,
  MessageSquare, Crown, Building2, ArrowRight, Sparkles, AlertOctagon, Bot, Plus, Minus, Trash2, LogOut, Clock, Vote, Trophy, RefreshCcw, Skull, Briefcase, ChevronDown
} from 'lucide-react';

// --- SOUND UTILS OPTIMIZED ---
// Singleton AudioContext to prevent memory leaks and browser limits
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    // Lazy initialization on first interaction
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

const playSound = (type: 'roll' | 'move' | 'money' | 'jail' | 'pop' | 'step' | 'gameover') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error("Audio resume failed", e));
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;

    if (type === 'roll') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'money') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'jail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.linearRampToValueAtTime(50, t + 0.5);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === 'pop') {
       osc.type = 'triangle';
       osc.frequency.setValueAtTime(600, t);
       osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);
       gain.gain.setValueAtTime(0.05, t);
       gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
       osc.start(t);
       osc.stop(t + 0.15);
    } else if (type === 'gameover') {
       osc.type = 'sawtooth';
       osc.frequency.setValueAtTime(200, t);
       osc.frequency.exponentialRampToValueAtTime(50, t + 1);
       gain.gain.setValueAtTime(0.2, t);
       gain.gain.linearRampToValueAtTime(0.001, t + 1);
       osc.start(t);
       osc.stop(t + 1);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

// Interface for Setup State
interface PlayerSetup {
  id: number;
  name: string;
  isAi: boolean;
  color: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    squares: INITIAL_SQUARES,
    diceValue: [0, 0],
    gamePhase: 'SETUP',
    logs: [],
    showModal: { type: null },
    gameDuration: -1,
    timeLeft: 0,
    votesToEnd: []
  });

  // Setup State
  const [setupPlayers, setSetupPlayers] = useState<PlayerSetup[]>([
    { id: 1, name: 'প্লেয়ার ১', isAi: false, color: PLAYER_COLORS[0].hex },
    { id: 2, name: 'বট ১', isAi: true, color: PLAYER_COLORS[1].hex },
    { id: 3, name: 'বট ২', isAi: true, color: PLAYER_COLORS[2].hex },
    { id: 4, name: 'বট ৩', isAi: true, color: PLAYER_COLORS[3].hex }
  ]);
  
  const [setupDuration, setSetupDuration] = useState<number>(-1); // -1 = Unlimited
  const [startMoney, setStartMoney] = useState<number>(1500); // Custom Starting Money
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // Track if animation is happening
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Mobile Specific State
  const [showMobileProperties, setShowMobileProperties] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (gameState.gamePhase !== 'PLAYING' || gameState.gameDuration === -1) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.gamePhase !== 'PLAYING') return prev;
        
        const newTime = prev.timeLeft - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          // Trigger Game Over
          playSound('gameover');
          return {
             ...prev,
             gamePhase: 'GAME_OVER',
             logs: [...prev.logs, { text: "সময় শেষ! খেলা সমাপ্ত।", type: 'event', time: new Date().toLocaleTimeString() }]
          };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gamePhase, gameState.gameDuration]);

  // --- AI LOGIC (ENHANCED) ---
  useEffect(() => {
    if (gameState.gamePhase !== 'PLAYING') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Only proceed if it is an AI player AND not bankrupt
    if (!currentPlayer || !currentPlayer.isAi || currentPlayer.isBankrupt) return;

    let aiTimeout: ReturnType<typeof setTimeout>;

    // 1. ROLL DICE: Fast response
    if (gameState.diceValue[0] === 0 && !isRolling && !isMoving && !gameState.showModal.type) {
        aiTimeout = setTimeout(() => {
            rollDice();
        }, 400); 
    } 
    // 2. HANDLE MODAL: Decisions
    else if (gameState.showModal.type) {
        aiTimeout = setTimeout(() => {
            if (gameState.showModal.type === 'BUY') {
                const square = gameState.showModal.data;
                const price = square.price;
                
                // STRATEGIC BUYING
                const hasMonopoly = checkMonopoly(square.colorGroup, currentPlayer.id, square.id); 
                const activeCount = gameState.players.filter(p => !p.isBankrupt).length;
                const isEndGame = activeCount <= 2;

                const cashBuffer = hasMonopoly ? 50 : (isEndGame ? 150 : 300);
                
                if (currentPlayer.money >= price && currentPlayer.money >= price + cashBuffer) {
                    confirmBuy();
                } else {
                    setGameState(prev => ({ ...prev, showModal: { type: null } }));
                }
            } else if (gameState.showModal.type === 'BANKRUPT') {
                // AI Acknowledges Bankruptcy
                checkGameOverOrContinue();
            } else {
                // Info / Chance / Community: Read quickly and close
                setGameState(prev => ({ ...prev, showModal: { type: null } }));
            }
        }, 800); 
    } 
    // 3. END TURN: Logic done -> Attempt Upgrade -> End Turn
    else if (gameState.diceValue[0] !== 0 && !isRolling && !isMoving && !gameState.showModal.type) {
        aiTimeout = setTimeout(() => {
            const didUpgrade = attemptAiUpgrade(currentPlayer);
            if (!didUpgrade) {
                endTurn();
            } else {
                setTimeout(endTurn, 400);
            }
        }, 400); 
    }

    return () => clearTimeout(aiTimeout);
  }, [gameState, isRolling, isMoving]);

  // AI Helper: Check if player owns all properties of a color group
  const checkMonopoly = (colorGroup: string | undefined, playerId: number | string, excludeSquareId: number = -1) => {
      if (!colorGroup || colorGroup === 'transparent') return false;
      const groupSquares = gameState.squares.filter(s => s.colorGroup === colorGroup);
      
      // If passing excludeSquareId, we treat that square as if we own it (for "completes monopoly" check)
      return groupSquares.every(s => s.id === excludeSquareId || s.ownerId === playerId);
  };

  // AI Helper: Attempt to upgrade a property if money allows
  const attemptAiUpgrade = (player: Player): boolean => {
      // Find upgradable properties
      const myProperties = gameState.squares.filter(
          s => s.ownerId === player.id && s.type === SquareType.PROPERTY && s.houses < 5
      );
      
      if (myProperties.length === 0) return false;

      // STRATEGIC UPGRADE: Prioritize Monopolies
      const candidates = myProperties.sort((a, b) => {
          const aMono = checkMonopoly(a.colorGroup, player.id);
          const bMono = checkMonopoly(b.colorGroup, player.id);
          if (aMono && !bMono) return -1;
          if (!aMono && bMono) return 1;
          return b.rent[b.houses + 1] - a.rent[a.houses + 1]; // Sort by potential rent gain
      });

      for (const candidate of candidates) {
           const isMonopoly = checkMonopoly(candidate.colorGroup, player.id);
           const activeCount = gameState.players.filter(p => !p.isBankrupt).length;
           // Be aggressive in endgame
           const safeMoney = (isMonopoly || activeCount <= 2) ? 150 : 500; 

           if (player.money >= candidate.houseCost + safeMoney) {
               // Perform upgrade directly
               const newPlayers = [...gameState.players];
               const pIdx = newPlayers.findIndex(p => p.id === player.id);
               newPlayers[pIdx].money -= candidate.houseCost;

               const newSquares = [...gameState.squares];
               const sqIdx = newSquares.findIndex(s => s.id === candidate.id);
               newSquares[sqIdx].houses += 1;

               playSound('money');
               setGameState(prev => ({
                   ...prev,
                   players: newPlayers,
                   squares: newSquares,
                   logs: [...prev.logs, addLog(`${player.name} ${candidate.name} এর উন্নয়ন করেছে।`, 'success')]
               }));
               return true;
           }
      }
      return false;
  };

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'event' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { text, type, time };
  };

  // --- SETUP HANDLERS ---
  const addSetupPlayer = () => {
    if (setupPlayers.length >= 6) return;
    const nextId = setupPlayers.length + 1;
    const nextColor = PLAYER_COLORS[(nextId - 1) % PLAYER_COLORS.length].hex;
    setSetupPlayers([...setupPlayers, { 
      id: nextId, 
      name: `বট ${nextId - 1}`, 
      isAi: true, 
      color: nextColor 
    }]);
    playSound('pop');
  };

  const removeSetupPlayer = (id: number) => {
    if (setupPlayers.length <= 4) return;
    setSetupPlayers(setupPlayers.filter(p => p.id !== id));
    playSound('pop');
  };

  const updateSetupPlayer = (id: number, field: keyof PlayerSetup, value: any) => {
    setSetupPlayers(setupPlayers.map(p => {
      if (p.id === id) {
        if (field === 'isAi' && value === true && p.name.includes('প্লেয়ার')) {
           return { ...p, [field]: value, name: `বট ${p.id}` };
        }
        if (field === 'isAi' && value === false && p.name.includes('বট')) {
           return { ...p, [field]: value, name: `প্লেয়ার ${p.id}` };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const startGame = () => {
    playSound('money');
    getAudioContext();
    
    const newPlayers: Player[] = setupPlayers.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isAi: p.isAi,
      money: startMoney, // Use customized starting money
      position: 0,
      isBankrupt: false,
      inJail: false,
      jailTurns: 0
    }));

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      gamePhase: 'PLAYING',
      squares: JSON.parse(JSON.stringify(INITIAL_SQUARES)),
      logs: [addLog('খেলা শুরু! প্রথম চালের অপেক্ষা...', 'event')],
      diceValue: [0, 0],
      currentPlayerIndex: 0,
      gameDuration: setupDuration,
      timeLeft: setupDuration === -1 ? 0 : setupDuration * 60,
      votesToEnd: []
    }));
  };

  const leaveGame = () => {
    if(window.confirm("আপনি কি নিশ্চিত যে আপনি খেলা থেকে বের হতে চান?")) {
      // Calculate current rankings before leaving
      const currentRankings = calculateCurrentRankings();
      setGameState(prev => ({
        ...prev,
        gamePhase: 'GAME_OVER',
        showModal: { type: null },
        logs: [...prev.logs, addLog("খেলা ছেড়ে দেওয়া হয়েছে। ফলাফল দেখুন।", 'event')]
      }));
    }
  };

  // --- GAME END LOGIC ---
  const handleVoteEnd = () => {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      let newVotes = [...gameState.votesToEnd];
      if (newVotes.includes(currentPlayer.id)) {
          newVotes = newVotes.filter(id => id !== currentPlayer.id);
          playSound('pop');
      } else {
          newVotes.push(currentPlayer.id);
          playSound('money');
      }

      setGameState(prev => ({
          ...prev,
          votesToEnd: newVotes,
          logs: [...prev.logs, addLog(`${currentPlayer.name} খেলা শেষ করার ভোট দিয়েছেন। (${newVotes.length}/${prev.players.filter(p => !p.isAi).length})`, 'event')]
      }));

      // Check Majority (Only counting Human Players for majority calculation)
      const humanPlayers = gameState.players.filter(p => !p.isAi);
      if (newVotes.length > humanPlayers.length / 2) {
          setTimeout(() => {
             setGameState(prev => ({
                 ...prev,
                 gamePhase: 'GAME_OVER',
                 logs: [...prev.logs, addLog("সংখ্যাগরিষ্ঠ ভোটে খেলা সমাপ্ত ঘোষণা করা হলো!", 'event')]
             }));
             playSound('money');
          }, 1000);
      }
  };

  const calculateWinner = () => {
      const activePlayers = gameState.players.filter(p => !p.isBankrupt);
      
      const leaderboard = activePlayers.map(player => {
          let propertyValue = 0;
          gameState.squares.forEach(sq => {
              if (sq.ownerId === player.id) {
                  propertyValue += sq.price;
                  propertyValue += (sq.houses * sq.houseCost);
                  if (sq.isMortgaged) {
                      propertyValue -= (sq.price / 2);
                  }
              }
          });
          const totalWealth = player.money + propertyValue;
          return { ...player, totalWealth, propertyValue };
      });

      return leaderboard.sort((a, b) => b.totalWealth - a.totalWealth);
  };

  const calculateCurrentRankings = () => {
      // Calculate rankings for ALL players (including bankrupt ones)
      const leaderboard = gameState.players.map(player => {
          let propertyValue = 0;
          gameState.squares.forEach(sq => {
              if (sq.ownerId === player.id) {
                  propertyValue += sq.price;
                  propertyValue += (sq.houses * sq.houseCost);
                  if (sq.isMortgaged) {
                      propertyValue -= (sq.price / 2);
                  }
              }
          });
          const totalWealth = player.money + propertyValue;
          return { ...player, totalWealth, propertyValue };
      });

      return leaderboard.sort((a, b) => b.totalWealth - a.totalWealth);
  };

  const checkGameOverOrContinue = () => {
      setGameState(prev => {
          // Check if only 1 player left
          const activePlayers = prev.players.filter(p => !p.isBankrupt);
          if (activePlayers.length <= 1) {
              playSound('money');
              return {
                  ...prev,
                  showModal: { type: null },
                  gamePhase: 'GAME_OVER',
                  logs: [...prev.logs, addLog("খেলা সমাপ্ত! একজন বাদে সবাই দেউলিয়া।", 'event')]
              };
          }
          // If more than 1 player remains, continue the game
          return { ...prev, showModal: { type: null } };
      });
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Num 0 or Numpad0 is pressed
      if (e.key === '0' || e.key === 'Numpad0') {
        e.preventDefault();
        rollDice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.gamePhase, isRolling, isMoving]);

  // --- ACTION HANDLERS ---

  const rollDice = () => {
    if (gameState.gamePhase !== 'PLAYING' || gameState.diceValue[0] !== 0 || isRolling || isMoving) return; 

    setIsRolling(true);
    let rollCount = 0;
    const maxRolls = 10;

    const interval = setInterval(() => {
      playSound('roll');
      setGameState(prev => ({
        ...prev,
        diceValue: [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
      }));
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        playSound('pop');
        setGameState(prev => ({
           ...prev,
           diceValue: [d1, d2]
        }));
        setIsRolling(false);
        // Start smooth movement
        processDiceResult(d1, d2);
      }
    }, 50);
  };

  const animatePlayerMovement = (playerId: number, stepsRemaining: number, currentPos: number, totalDice: number) => {
     if (stepsRemaining <= 0) {
         setIsMoving(false);
         // Slight delay before landing event
         setTimeout(() => {
             setGameState(finalState => {
                 handleLanding(finalState.players.find(p => p.id === playerId)!.position, finalState.players, totalDice);
                 return finalState;
             });
         }, 300);
         return;
     }

     setIsMoving(true);
     
     // Move 1 step
     setGameState(prev => {
         const newPlayers = prev.players.map(p => {
             if (p.id === playerId) {
                 const nextPos = (p.position + 1) % 40;
                 return { ...p, position: nextPos };
             }
             return p;
         });
         
         const p = prev.players.find(p => p.id === playerId);
         // PASSING GO LOGIC: Moving from 39 to 0
         if (p && (p.position + 1) === 40) {
             const updatedPlayersWithMoney = newPlayers.map(pl => 
                 pl.id === playerId ? { ...pl, money: pl.money + 200 } : pl
             );
             playSound('money');
             // Add Pass Go Log
             return { 
                 ...prev, 
                 players: updatedPlayersWithMoney,
                 logs: [...prev.logs, addLog(`${p.name} শুরু অতিক্রম করেছে এবং ২০০ টাকা পেয়েছে।`, 'success')] 
             };
         }

         return { ...prev, players: newPlayers };
     });
     
     // Schedule next step
     setTimeout(() => {
         animatePlayerMovement(playerId, stepsRemaining - 1, (currentPos + 1) % 40, totalDice);
     }, 150); 
  };

  const processDiceResult = (d1: number, d2: number) => {
    const total = d1 + d2;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Jail Check
    if (currentPlayer.inJail) {
      if (d1 === d2) {
        // Released
        const updatedPlayers = [...gameState.players];
        updatedPlayers[gameState.currentPlayerIndex] = { 
          ...currentPlayer, 
          inJail: false, 
          jailTurns: 0
        };
        playSound('money');
        setGameState(prev => ({
          ...prev,
          players: updatedPlayers,
          logs: [...prev.logs, addLog(`${currentPlayer.name} ডাবলস চাল দিয়ে জেল থেকে বের হয়েছে!`, 'success')]
        }));
        // Animate movement from Jail (pos 10)
        animatePlayerMovement(currentPlayer.id, total, 10, total);
      } else {
        // Stay in Jail Logic
        let msg = `${currentPlayer.name} জেলেই থাকল।`;
        let turns = currentPlayer.jailTurns + 1;
        
        // Forced to pay after 3 turns
        if (turns >= 3) {
             // Deduct 50 Logic inline
             const newPlayers = [...gameState.players];
             const p = newPlayers[gameState.currentPlayerIndex];

             if (p.money < 50) {
                 // Bankrupt Logic
                 p.money = 0;
                 p.isBankrupt = true;
                 playSound('gameover');
                 setGameState(prev => ({
                    ...prev,
                    players: newPlayers,
                    showModal: {
                        type: 'BANKRUPT',
                        title: 'দেউলিয়া!',
                        message: `${p.name} জেল জরিমানা দিতে ব্যর্থ হয়েছেন। খেলা শেষ।`,
                        data: { playerName: p.name }
                    },
                    logs: [...prev.logs, addLog(`${p.name} দেউলিয়া হয়ে গেছেন!`, 'error')]
                 }));
                 
                 // Auto check for game end after bankruptcy
                 setTimeout(() => {
                     checkGameOverOrContinue();
                 }, 2000); // Show bankruptcy modal for 2 seconds, then auto-continue
                 return; // End here
             } else {
                 p.money -= 50;
                 p.inJail = false;
                 p.jailTurns = 0;
                 msg = `${currentPlayer.name} ৩ বার চেষ্টার পর ৫০ টাকা মুচলেকা দিয়ে বের হলো।`;
                 setGameState(prev => ({ ...prev, players: newPlayers, logs: [...prev.logs, addLog(msg, 'info')] }));
                 animatePlayerMovement(currentPlayer.id, total, 10, total);
             }
        } else {
             playSound('jail');
             const updatedPlayers = [...gameState.players];
             updatedPlayers[gameState.currentPlayerIndex] = { ...currentPlayer, jailTurns: turns };
             setGameState(prev => ({
                ...prev,
                players: updatedPlayers,
                logs: [...prev.logs, addLog(msg, 'info')]
             }));
        }
      }
      return;
    }

    setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, addLog(`${currentPlayer.name} মোট ${total} (${d1}+${d2}) দিয়েছে।`, 'info')]
    }));
    
    animatePlayerMovement(currentPlayer.id, total, currentPlayer.position, total);
  };

  const handleLanding = (pos: number, currentPlayers: Player[], diceSum: number) => {
    const square = gameState.squares[pos];
    const newPlayers = [...currentPlayers];
    const currentPlayerIndex = gameState.currentPlayerIndex;
    const player = newPlayers[currentPlayerIndex];

    let modal: GameState['showModal'] = { type: null };
    let log = '';

    // --- Strict Payment Helper ---
    const handleStrictPayment = (amount: number, beneficiaryId: number | null = null): boolean => {
        if (player.money < amount) {
            // BANKRUPT!
            const remaining = player.money;
            player.money = 0;
            player.isBankrupt = true;

            if (beneficiaryId !== null) {
                const owner = newPlayers.find(p => p.id === beneficiaryId);
                if (owner) owner.money += remaining;
            }

            modal = {
                type: 'BANKRUPT',
                title: 'দেউলিয়া!',
                message: `${player.name} এর কাছে পর্যাপ্ত টাকা নেই (প্রয়োজন ৳${amount})। খেলা থেকে বিদায়।`,
                data: { playerName: player.name }
            };
            playSound('gameover');
            log = `${player.name} দেউলিয়া হয়ে গেছেন!`;
            
            // Auto check for game end after bankruptcy
            setTimeout(() => {
                checkGameOverOrContinue();
            }, 2000); // Show bankruptcy modal for 2 seconds, then auto-continue
            
            return false;
        } else {
            // Pay
            player.money -= amount;
            if (beneficiaryId !== null) {
                const owner = newPlayers.find(p => p.id === beneficiaryId);
                if (owner) owner.money += amount;
            }
            return true;
        }
    };

    // Logic for squares
    if (square.type === SquareType.PROPERTY || square.type === SquareType.UTILITY) {
      if (square.ownerId === null) {
        playSound('pop');
        modal = { type: 'BUY', data: square };
      } else if (square.ownerId !== player.id) {
        const owner = newPlayers.find(p => p.id === square.ownerId);
        if (owner && !square.isMortgaged) {
            let rent = 0;
            if (square.type === SquareType.PROPERTY) {
                 rent = square.rent[square.houses];
            } else {
                 rent = 4 * diceSum; // Simplified utility rent
            }
            
            if (handleStrictPayment(rent, square.ownerId)) {
                playSound('money');
                log = `${square.name} এ ${owner.name} কে ভাড়া দিল ৳${rent}।`;
            }
        } else if (square.isMortgaged) {
            log = `${square.name} এ পড়েছে, কিন্তু এটি বন্ধক রাখা। ভাড়া নেই।`;
        }
      } else if (square.ownerId === player.id && square.type === SquareType.PROPERTY && square.houses < 5) {
           if (player.money >= square.houseCost) {
               modal = { type: 'UPGRADE', title: 'উন্নয়ন', message: `আপনি কি ${square.name} এর উন্নয়ন করতে চান? (খরচ ৳${square.houseCost})`, data: square };
           }
      }
    } else if (square.type === SquareType.CHANCE || square.type === SquareType.COMMUNITY) {
        const deck = square.type === SquareType.CHANCE ? CHANCE_CARDS : COMMUNITY_CARDS;
        const card = deck[Math.floor(Math.random() * deck.length)];
        
        playSound('pop');
        
        if (card.amount) {
            if (card.amount > 0) {
                player.money += card.amount;
                playSound('money');
            } else {
                if (!handleStrictPayment(Math.abs(card.amount))) {
                   // Bankrupt logic triggered inside helper
                }
            }
        } else if (card.move) {
             let p = player.position;
             
             // Special Fix for "Advance to Go" (move: 40 in constants)
             if (card.move === 40) {
                 p = 0;
                 player.money += 200; // Salary
                 playSound('money');
                 log = `${card.text}`;
             } else {
                 // Relative move
                 p += card.move;
                 if (p >= 40) {
                     p = p % 40;
                     player.money += 200;
                     playSound('money');
                 }
                 if (p < 0) p = (p + 40) % 40;
             }
             
             player.position = p;
        } else if (card.action === "GOTOJAIL") {
            player.position = 10;
            player.inJail = true;
            playSound('jail');
        } else if (card.action === "PAYALL10") {
             const count = newPlayers.filter(p => !p.isBankrupt && p.id !== player.id).length;
             const totalNeeded = count * 10;
             if (handleStrictPayment(totalNeeded)) {
                 newPlayers.forEach((p) => {
                    if (p.id !== player.id && !p.isBankrupt) p.money += 10;
                 });
             }
        } else if (card.action === "COLLECTALL10") {
             newPlayers.forEach((p) => {
                if (p.id !== player.id && !p.isBankrupt) {
                     if(p.money < 10) {
                         player.money += p.money;
                         p.money = 0; 
                     } else {
                         p.money -= 10;
                         player.money += 10;
                     }
                }
             });
        }

        if (!modal.type) { 
            log = log || `${square.name}: ${card.text}`;
            modal = { type: square.type, title: square.name, message: card.text, data: { id: card.id } };
        }

    } else if (square.type === SquareType.TAX) {
        if (handleStrictPayment(square.price)) {
            playSound('money');
            log = `কর প্রদান করল ৳${square.price}।`;
        }
    } else if (square.type === SquareType.GO_TO_JAIL) {
        player.position = 10; 
        player.inJail = true;
        playSound('jail');
        log = `জেলে পাঠানো হলো!`;
        modal = { type: 'INFO', title: 'গ্রেপ্তার!', message: 'আপনাকে জেলে পাঠানো হয়েছে।' };
    }

    setGameState(prev => ({
        ...prev,
        players: newPlayers,
        logs: log ? [...prev.logs, addLog(log, modal.type === 'BANKRUPT' ? 'error' : 'event')] : prev.logs,
        showModal: modal.type ? modal : { type: null }
    }));
  };

  const confirmBuy = () => {
      const playerIdx = gameState.currentPlayerIndex;
      const player = gameState.players[playerIdx];
      const square = gameState.showModal.data;

      if (player.money >= square.price) {
          const newPlayers = [...gameState.players];
          newPlayers[playerIdx].money -= square.price;
          
          const newSquares = [...gameState.squares];
          const sqIndex = newSquares.findIndex(s => s.id === square.id);
          newSquares[sqIndex].ownerId = player.id;
          
          playSound('money');

          setGameState(prev => ({
              ...prev,
              players: newPlayers,
              squares: newSquares,
              showModal: { type: null },
              logs: [...prev.logs, addLog(`${player.name} ৳${square.price} দিয়ে ${square.name} কিনেছে।`, 'success')]
          }));
      }
  };

  const endTurn = () => {
      let nextIdx = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      let safetyCounter = 0;
      
      while (gameState.players[nextIdx].isBankrupt && safetyCounter < gameState.players.length) {
          nextIdx = (nextIdx + 1) % gameState.players.length;
          safetyCounter++;
      }

      const activePlayers = gameState.players.filter(p => !p.isBankrupt);
      
      if (activePlayers.length <= 1 && gameState.players.length > 1) {
           setGameState(prev => ({
                 ...prev,
                 gamePhase: 'GAME_OVER',
                 logs: [...prev.logs, addLog("খেলা সমাপ্ত! একজন বাদে সবাই দেউলিয়া।", 'event')]
           }));
           return;
      }

      setGameState(prev => ({
          ...prev,
          currentPlayerIndex: nextIdx,
          diceValue: [0, 0], 
          logs: [...prev.logs, addLog(`${prev.players[nextIdx].name} এর চাল।`, 'info')]
      }));
  };

  const upgradeProperty = () => {
      const square = gameState.showModal.data;
      const sqIndex = gameState.squares.findIndex(s => s.id === square.id);
      const player = gameState.players[gameState.currentPlayerIndex];

      if (player.money >= square.houseCost) {
          const newPlayers = [...gameState.players];
          newPlayers[gameState.currentPlayerIndex].money -= square.houseCost;
          
          const newSquares = [...gameState.squares];
          newSquares[sqIndex].houses += 1;
          playSound('money');

          setGameState(prev => ({
              ...prev,
              players: newPlayers,
              squares: newSquares,
              showModal: { type: null },
              logs: [...prev.logs, addLog(`${square.name} এর উন্নয়ন করা হলো ৳${square.houseCost} দিয়ে।`, 'success')]
          }));
      }
  };

  // --- UI COMPONENTS ---

  const VoteControl = ({ mobile = false }) => {
    const humanPlayersCount = gameState.players.filter(p => !p.isAi).length;
    const votesNeeded = Math.floor(humanPlayersCount / 2) + 1;
    const currentVotes = gameState.votesToEnd.length;
    const hasVoted = gameState.votesToEnd.includes(currentPlayer.id);
    const progress = Math.min(100, (currentVotes / votesNeeded) * 100);

    const canVote = !currentPlayer.isAi;

    return (
        <button 
            onClick={canVote ? handleVoteEnd : undefined}
            disabled={!canVote}
            className={`group relative overflow-hidden flex items-center gap-2 ${mobile ? 'bg-slate-800 p-2 rounded-lg' : 'bg-slate-800/90 hover:bg-slate-700 pl-3 pr-4 py-1.5 rounded-full border border-slate-600'} shadow-lg transition ${hasVoted ? 'ring-2 ring-green-500' : ''}`}
            title="খেলা শেষ করার জন্য ভোট দিন"
        >
            {!mobile && (
                <div 
                    className="absolute inset-0 bg-green-500/20 transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }} 
                />
            )}
            
            <div className={`p-1 rounded-full ${hasVoted ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                <Vote size={mobile ? 16 : 14} />
            </div>
            {!mobile && (
                <div className="flex flex-col items-start z-10">
                    <span className="text-[10px] uppercase text-slate-400 font-regular leading-none">সমাপ্তির ভোট</span>
                    <span className="text-xs font-regular leading-none mt-0.5">
                        <span className={currentVotes >= votesNeeded ? "text-green-400" : "text-white"}>{currentVotes}</span>
                        <span className="text-slate-500">/{votesNeeded}</span>
                    </span>
                </div>
            )}
        </button>
    );
  };

  // --- RENDER HELPERS ---

  if (gameState.gamePhase === 'SETUP') {
     return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white font-['Hind_Siliguri'] overflow-y-auto p-4">
        <div className="w-full max-w-2xl bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 p-6 md:p-8">
          <div className="text-center mb-8">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <h1 className="text-3xl font-black tracking-tight">ধনী হবার <span className="text-blue-500">মজার খেলা</span></h1>
            <p className="text-slate-400 text-sm">গেম সেটআপ করুন (সর্বনিম্ন ৪ জন খেলোয়াড়)</p>
          </div>
          <div className="space-y-4 mb-8">
            {/* Money Setup */}
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-3 text-slate-300 font-regular">
                   <div className="bg-green-600 p-2 rounded-lg"><span className="text-white font-mono font-regular text-lg">৳</span></div>
                   <span>শুরুর টাকা (Starting Money)</span>
               </div>
               <div className="flex items-center gap-2">
                   <button onClick={() => setStartMoney(Math.max(500, startMoney - 500))} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white transition"><Minus size={18}/></button>
                   <input 
                      type="number" 
                      value={startMoney} 
                      onChange={(e) => setStartMoney(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-600 text-white text-center font-mono font-regular text-lg rounded py-1 w-28 focus:outline-none focus:border-green-500"
                   />
                   <button onClick={() => setStartMoney(startMoney + 500)} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white transition"><Plus size={18}/></button>
               </div>
            </div>

            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700">
               <div className="flex items-center gap-3 text-slate-300 font-regular mb-2">
                   <Clock size={18} /> গেমের সময়সীমা নির্ধারণ
               </div>
               <div className="grid grid-cols-4 gap-2">
                   {[5, 10, 20, 30, 45, 60, -1].map((min) => (
                       <button
                          key={min}
                          onClick={() => setSetupDuration(min)}
                          className={`py-2 rounded-lg font-regular text-sm transition ${setupDuration === min ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                       >
                           {min === -1 ? 'আনলিমিটেড' : `${min} মিনিট`}
                       </button>
                   ))}
               </div>
            </div>
            {setupPlayers.map((p, idx) => (
              <div key={p.id} className="flex flex-col md:flex-row gap-4 items-center bg-[#0f172a] p-4 rounded-xl border border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${idx * 100}ms`}}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full font-regular shadow-lg" style={{backgroundColor: p.color}}>
                   {p.isAi ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    value={p.name} 
                    onChange={(e) => updateSetupPlayer(p.id, 'name', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                    placeholder="খেলোয়াড়ের নাম"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                   <button 
                    onClick={() => updateSetupPlayer(p.id, 'isAi', !p.isAi)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-regular transition ${p.isAi ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                   >
                     {p.isAi ? <><Bot size={14} /> বট</> : <><User size={14} /> মানুষ</>}
                   </button>
                   <div className="flex gap-1">
                      {PLAYER_COLORS.slice(0, 6).map((c) => (
                        <button 
                          key={c.hex}
                          onClick={() => updateSetupPlayer(p.id, 'color', c.hex)}
                          className={`w-6 h-6 rounded-full border-2 ${p.color === c.hex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'} transition`}
                          style={{backgroundColor: c.hex}}
                        />
                      ))}
                   </div>
                   {setupPlayers.length > 4 && (
                     <button onClick={() => removeSetupPlayer(p.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition">
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            ))}
            {setupPlayers.length < 6 && (
              <button onClick={addSetupPlayer} className="w-full py-3 border-2 border-dashed border-slate-700 text-slate-400 rounded-xl hover:border-slate-500 hover:text-slate-200 transition flex items-center justify-center gap-2 font-regular">
                 <Plus size={18} /> অতিরিক্ত প্লেয়ার যোগ করুন
              </button>
            )}
          </div>
          <button 
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-regular text-xl rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
          >
            <Play fill="currentColor" /> খেলা শুরু করুন
          </button>
        </div>
      </div>
    );
  }

  // --- GAME OVER SCREEN ---
  if (gameState.gamePhase === 'GAME_OVER') {
      // Check if this is an abandoned game (check recent logs)
      const isAbandoned = gameState.logs.some(log => log.text.includes('খেলা ছেড়ে দেওয়া হয়েছে'));
      
      // Use current rankings for abandoned games, winner for completed games
      const results = isAbandoned ? calculateCurrentRankings() : calculateWinner();
      const winner = results[0];
      
      return (
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4 font-['Hind_Siliguri']">
             <div className="w-full max-w-lg bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-slate-700 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
                {isAbandoned ? (
                  <AlertOctagon size={64} className="mx-auto text-orange-500 mb-4" />
                ) : (
                  <Trophy size={64} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
                )}
                <h1 className="text-4xl font-black mb-2 text-white">{isAbandoned ? 'খেলা ছেড়ে দেওয়া হয়েছে' : 'অভিনন্দন!'}</h1>
                <h2 className="text-2xl font-regular text-yellow-400 mb-6">{isAbandoned ? 'চূড়ান্ত অবস্থা' : `${winner.name} জয়ী হয়েছেন!`}</h2>
                
                <div className="space-y-3 mb-8">
                    {results.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] border border-slate-700">
                             <div className="flex items-center gap-3">
                                 <span className="font-regular text-slate-500">#{idx + 1}</span>
                                 <div className="w-8 h-8 rounded-full shadow border-2 border-white/20" style={{backgroundColor: p.color}}></div>
                                 <div className="text-left">
                                     <div className="font-regular">{p.name}</div>
                                     <div className="text-xs text-slate-400">নগদ: ৳{p.money} | সম্পদ: ৳{(p as any).propertyValue}</div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="text-xs text-slate-400">মোট সম্পদ</div>
                                 <div className="font-regular text-green-400 text-lg">৳{(p as any).totalWealth}</div>
                             </div>
                        </div>
                    ))}
                </div>

                <button 
                  onClick={() => setGameState(prev => ({ ...prev, gamePhase: 'SETUP', logs: [], showModal: { type: null } }))}
                  className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-regular rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                >
                    <RefreshCcw size={20} /> নতুন গেম শুরু করুন
                </button>
             </div>
        </div>
      );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myProperties = gameState.squares.filter(s => s.ownerId === currentPlayer.id);

  // Shared Active Player Controls
  const ActionControls = ({ mobile = false }) => (
      <div className={`flex gap-2 w-full ${mobile ? 'h-full' : ''}`}>
          {gameState.diceValue[0] === 0 ? (
              <button 
                  onClick={rollDice}
                  disabled={isRolling || isMoving || currentPlayer.isAi}
                  className={`flex-1 ${mobile ? 'py-3' : 'py-3 lg:py-4'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-regular text-base lg:text-lg shadow-lg flex items-center justify-center gap-2 transition ${isRolling || isMoving || currentPlayer.isAi ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  <Dice5 size={mobile ? 20 : 24} className={isRolling ? "animate-spin" : ""} /> 
                  <span className="whitespace-nowrap">{isRolling ? 'হচ্ছে...' : currentPlayer.isAi ? 'বট...' : 'লুডু চালুন'}</span>
              </button>
          ) : (
              <button 
                  onClick={() => { playSound('pop'); endTurn(); }}
                  disabled={currentPlayer.isAi || isMoving}
                  className={`flex-1 ${mobile ? 'py-3' : 'py-3 lg:py-4'} bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-regular text-base lg:text-lg shadow-lg flex items-center justify-center gap-2 transition ${currentPlayer.isAi || isMoving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  <ArrowRight size={mobile ? 20 : 24} /> 
                  <span className="whitespace-nowrap">{currentPlayer.isAi ? 'চাল শেষ...' : 'চাল শেষ'}</span>
              </button>
          )}
      </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-['Hind_Siliguri']">
       
      {/* --- MOBILE TOP BAR (Opponents + Info) --- */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-[#161b28] border-b border-slate-700 z-30 shrink-0 h-14">
          {/* Opponent Icons List (Top Left) */}
          <div className="flex items-center -space-x-2 overflow-hidden">
             {gameState.players.filter(p => p.id !== currentPlayer.id).map(p => (
                 <div key={p.id} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-[10px] shadow-sm relative" style={{backgroundColor: p.color}}>
                    {p.isAi ? <Bot size={14} className="text-white"/> : <User size={14} className="text-white"/>}
                    {gameState.votesToEnd.includes(p.id) && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black" />}
                 </div>
             ))}
             {gameState.players.length <= 1 && <span className="text-xs text-slate-500">একা</span>}
          </div>

          {/* Center Info: Timer */}
          {gameState.gameDuration !== -1 && (
             <div className="flex items-center gap-1 text-xs font-mono font-regular text-slate-300 bg-slate-800 px-2 py-1 rounded">
                <Clock size={12} className={gameState.timeLeft < 60 ? 'text-red-500' : 'text-blue-400'} />
                {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
             </div>
          )}

          {/* Right Controls: Vote, Exit */}
          <div className="flex items-center gap-2">
              <VoteControl mobile />
              <button onClick={leaveGame} className="bg-red-600/80 text-white p-2 rounded-lg"><LogOut size={16} /></button>
          </div>
      </div>

      {/* --- DESKTOP LEFT SIDEBAR (LOGS) --- */}
      <div className="w-72 hidden lg:flex flex-col border-r border-slate-800 bg-[#161b28]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-slate-100 font-regular">
            <MessageSquare size={18} /> খেলার বিবরণ
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {gameState.logs.map((log, i) => (
                <div key={i} className={`text-sm p-2 rounded border-l-2 ${log.type === 'event' ? 'border-blue-500 bg-blue-900/20' : log.type === 'success' ? 'border-green-500 bg-green-900/20' : log.type === 'error' ? 'border-red-500 bg-red-900/20' : 'border-slate-600 bg-slate-800/50'}`}>
                    <span className="text-[10px] text-slate-400 block mb-0.5">{log.time}</span>
                    {log.text}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
      </div>

      {/* --- CENTER AREA (BOARD) --- */}
      <div className="flex-1 relative bg-[#0b101d] flex flex-col items-center justify-center p-0 lg:p-2 overflow-hidden order-1 lg:order-2">
         {/* Desktop Top Overlay */}
         <div className="hidden lg:flex absolute top-4 right-4 z-40 items-start gap-2">
             <VoteControl />
             <button onClick={leaveGame} className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"><LogOut size={20} /></button>
         </div>
         {gameState.gameDuration !== -1 && (
             <div className="hidden lg:flex absolute top-4 left-4 z-40 bg-slate-800/80 text-white px-3 py-1.5 rounded-full text-xs font-mono font-regular items-center gap-2 border border-slate-600 shadow">
                 <Clock size={14} className={gameState.timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                 {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
             </div>
         )}

         {/* The Board Container */}
         {/* Updated for Mobile: Full width/height usage minus bars */}
         <div className="w-full h-full flex items-center justify-center border border-gray-200">
            <div className="w-full aspect-square max-h-full lg:h-[calc(100vh-2rem)] relative">
                <Board squares={gameState.squares} players={gameState.players} diceValue={gameState.diceValue[0] === 0 ? null : gameState.diceValue} isRolling={isRolling} />
                
                {/* MODAL POPUP */}
                {gameState.showModal.type && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
                        <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm rounded-xl"></div>
                        <div className="relative pointer-events-auto transform transition-all animate-in fade-in zoom-in duration-300 w-full max-w-sm flex flex-col items-center">
                            {/* Card Content Logic */}
                            {(gameState.showModal.type === SquareType.CHANCE || gameState.showModal.type === SquareType.COMMUNITY) ? (
                                <div className={`w-full py-6 ${gameState.showModal.type === SquareType.CHANCE ? 'bg-orange-500' : 'bg-blue-600'} rounded-2xl shadow-2xl flex flex-col items-center text-center relative border-4 border-white/20`}>
                                    <div className="w-[90%] bg-white/10 border-2 border-white/30 rounded-xl flex flex-col items-center justify-center p-4">
                                        <div className="text-white">
                                            {gameState.showModal.type === SquareType.CHANCE ? <Sparkles size={32} className="mx-auto" /> : <Crown size={32} className="mx-auto" />}
                                            <h3 className="font-regular text-lg mt-2 border-b-2 border-white/50 pb-2">{gameState.showModal.title}</h3>
                                        </div>
                                        <p className="text-white text-base font-medium leading-relaxed drop-shadow-md my-4">
                                            {gameState.showModal.message}
                                        </p>
                                        {!currentPlayer.isAi && (
                                        <button onClick={() => setGameState(prev => ({ ...prev, showModal: { type: null } }))} className="bg-white text-black px-6 py-2 rounded-full font-regular hover:scale-105 transition shadow-lg text-sm">
                                            ঠিক আছে
                                        </button>
                                        )}
                                    </div>
                                </div>
                            ) : gameState.showModal.type === 'BUY' ? (
                                <div className="bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl w-full overflow-hidden">
                                    <div className="h-4 w-full" style={{ backgroundColor: gameState.showModal.data.colorGroup || '#64748b' }}></div>
                                    <div className="p-6 text-center">
                                        <h2 className="text-xl font-regular text-white mb-1">{gameState.showModal.data.name}</h2>
                                        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700 mt-4">
                                            <div className="text-slate-400 text-xs mb-1">মূল্য</div>
                                            <div className={`text-3xl font-black ${currentPlayer.money >= gameState.showModal.data.price ? 'text-green-400' : 'text-red-400'}`}>৳{gameState.showModal.data.price}</div>
                                            {currentPlayer.money < gameState.showModal.data.price && (
                                                <div className="text-red-400 text-xs mt-1 font-regular">পর্যাপ্ত টাকা নেই!</div>
                                            )}
                                        </div>
                                        {!currentPlayer.isAi ? (
                                            <div className="flex gap-3">
                                                <button onClick={() => setGameState(prev => ({ ...prev, showModal: { type: null } }))} className="flex-1 py-3 rounded-lg bg-slate-700 text-white font-regular hover:bg-slate-600 transition">না</button>
                                                <button 
                                                    onClick={confirmBuy} 
                                                    disabled={currentPlayer.money < gameState.showModal.data.price}
                                                    className={`flex-1 py-3 rounded-lg text-white font-regular transition shadow-lg ${currentPlayer.money >= gameState.showModal.data.price ? 'bg-green-600 hover:bg-green-500 shadow-green-900/50' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                                                >
                                                    কিনব
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-blue-400 font-regular animate-pulse">বট সিদ্ধান্ত নিচ্ছে...</div>
                                        )}
                                    </div>
                                </div>
                            ) : (gameState.showModal.type === 'UPGRADE') ? (
                                <div className="bg-[#1e293b] border border-blue-500 rounded-xl shadow-2xl w-full p-6 text-center">
                                    <Building2 size={48} className="mx-auto text-blue-500 mb-4" />
                                    <h3 className="text-xl font-regular text-white mb-2">{gameState.showModal.title}</h3>
                                    <p className="text-slate-300 mb-6 text-sm">{gameState.showModal.message}</p>
                                    {!currentPlayer.isAi ? (
                                        <div className="flex gap-3">
                                           <button onClick={() => setGameState(prev => ({ ...prev, showModal: { type: null } }))} className="flex-1 py-2 rounded-lg bg-slate-700 text-white font-regular">না</button>
                                           <button onClick={upgradeProperty} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-regular">হ্যাঁ</button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : gameState.showModal.type === 'BANKRUPT' ? (
                                <div className="bg-red-950/90 border-4 border-red-600 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] w-full p-6 text-center animate-pulse">
                                    <Skull size={48} className="mx-auto text-red-500 mb-4 drop-shadow-lg" />
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">দেউলিয়া!</h3>
                                    <p className="text-red-200 mb-6 font-regular text-sm">{gameState.showModal.message}</p>
                                    <div className="text-red-300 font-regular text-sm">খেলা স্বয়ংক্রিয়ভাবে চলতে থাকবে...</div>
                                </div>
                            ) : (
                                <div className="bg-[#1e293b] border-2 border-red-500 rounded-xl shadow-2xl w-full p-6 text-center">
                                    <AlertOctagon size={48} className="mx-auto text-red-500 mb-4" />
                                    <h3 className="text-xl font-regular text-white mb-2">{gameState.showModal.title}</h3>
                                    <p className="text-slate-300 mb-6">{gameState.showModal.message}</p>
                                    {!currentPlayer.isAi ? (
                                        <button onClick={() => setGameState(prev => ({ ...prev, showModal: { type: null } }))} className="w-full py-2 rounded-lg bg-slate-700 text-white font-regular hover:bg-slate-600">বন্ধ করুন</button>
                                    ) : (
                                        <div className="text-slate-400 text-sm">অপেক্ষা করুন...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* --- MOBILE BOTTOM BAR (Controls + Active Player) --- */}
      <div className="lg:hidden flex flex-col bg-[#161b28] border-t border-slate-700 z-30 order-2 shrink-0 safe-area-bottom">
           
          {/* Main Controls Row */}
          <div className="flex items-center gap-3 p-3">
               {/* Active Player Avatar + Money */}
               <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center relative shadow-lg" style={{backgroundColor: currentPlayer.color}}>
                         {currentPlayer.isAi ? <Bot size={24} className="text-white"/> : <User size={24} className="text-white"/>}
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                         </div>
                    </div>
               </div>

               {/* Action Button */}
               <div className="flex-1">
                   <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                       <span className="font-regular text-slate-200">{currentPlayer.name}</span>
                       <span className={`font-mono font-regular ${currentPlayer.isBankrupt ? 'text-red-500' : 'text-green-400'}`}>৳{currentPlayer.money}</span>
                   </div>
                   <ActionControls mobile />
               </div>

               {/* Properties Button */}
               <button 
                  onClick={() => setShowMobileProperties(!showMobileProperties)}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${showMobileProperties ? 'bg-slate-700 border-slate-500' : 'bg-slate-800 border-slate-700'} text-slate-300`}
               >
                   <Briefcase size={18} />
                   <span className="text-[8px] font-regular mt-1">সম্পদ</span>
               </button>
          </div>

          {/* Collapsible Property Drawer */}
          <div className={`transition-all duration-300 ease-in-out bg-[#0f172a] border-t border-slate-800 overflow-hidden ${showMobileProperties ? 'max-h-60' : 'max-h-0'}`}>
              <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-regular text-slate-400">আপনার সম্পত্তি ({myProperties.length})</span>
                       <button onClick={() => setShowMobileProperties(false)}><ChevronDown size={16} className="text-slate-500"/></button>
                  </div>
                  {myProperties.length === 0 ? (
                      <div className="text-center text-xs text-slate-600 py-4 italic">আপনার কোনো সম্পত্তি নেই</div>
                  ) : (
                      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-48">
                          {myProperties.map(prop => (
                              <div key={prop.id} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                                   <div className="w-2 h-full rounded-full self-stretch" style={{backgroundColor: prop.colorGroup}} />
                                   <div className="flex-1 min-w-0">
                                       <div className="text-[10px] text-white font-regular truncate">{prop.name}</div>
                                       {prop.houses > 0 && (
                                           <div className="flex items-center gap-1 text-[9px] text-yellow-500">
                                               <Home size={8} /> {prop.houses}
                                           </div>
                                       )}
                                   </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- DESKTOP RIGHT SIDEBAR (STATS & CONTROLS) --- */}
      <div className="w-80 hidden lg:flex flex-col border-l border-slate-800 bg-[#161b28] order-3">
        {/* Player List */}
        <div className="flex-1 overflow-y-auto border-b border-slate-800">
            <div className="p-4 text-sm font-regular text-slate-500">খেলোয়াড় তালিকা</div>
            {gameState.players.map((p, idx) => (
                <div key={p.id} className={`px-4 py-3 flex items-center justify-between border-l-4 transition-colors relative ${idx === gameState.currentPlayerIndex ? 'border-blue-500 bg-slate-800' : 'border-transparent hover:bg-slate-800/50'} ${p.isBankrupt ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full shadow-inner flex items-center justify-center font-regular text-white text-xs border-2 ${gameState.votesToEnd.includes(p.id) ? 'border-green-400 ring-2 ring-green-500/50' : 'border-white/20'}`} style={{backgroundColor: p.color}}>
                             {p.isAi ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div>
                            <div className="text-base font-regular text-slate-200 flex items-center gap-2">
                                {p.name}
                                {gameState.votesToEnd.includes(p.id) && <span className="text-[10px] bg-green-500 text-black px-1.5 rounded font-regular">ভোট দিয়েছে</span>}
                                {p.isBankrupt && <Skull size={14} className="text-red-500" />}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                {p.isBankrupt ? 'খেলা থেকে বাদ' : <><Home size={10} /> {gameState.squares[p.position].name}</>}
                            </div>
                        </div>
                    </div>
                    <div className={`font-mono font-regular text-lg ${p.isBankrupt ? 'text-red-500' : 'text-green-400'}`}>
                        {p.isBankrupt ? 'X' : `৳${p.money}`}
                    </div>
                </div>
            ))}
        </div>

        {/* Active Player Controls */}
        <div className="p-6 bg-[#1e293b] border-t border-slate-700 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-regular text-slate-400">বর্তমান চাল</span>
                <span className="px-3 py-1 bg-blue-600 text-sm rounded-full text-white font-regular shadow flex items-center gap-2">
                    {currentPlayer.isAi ? <Bot size={14} className="animate-pulse" /> : <div className="w-3 h-3 rounded-full bg-white animate-pulse" />}
                    {currentPlayer.name}
                </span>
            </div>

            <div className="mb-4">
                <ActionControls />
            </div>
            
            {/* My Properties Mini-View LIST STYLE UPDATE */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-regular text-slate-500 uppercase">সম্পদ ({myProperties.length})</span>
                </div>
                {/* NEW LIST STYLE - Single line, Name only */}
                <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto pr-1">
                    {myProperties.map(prop => (
                        <div 
                           key={prop.id}
                           className="flex items-center gap-3 px-2 py-1.5 rounded transition cursor-default text-slate-300"
                        >
                            {/* Tiny color indicator */}
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: prop.colorGroup}}></div>
                            
                            {/* Name */}
                            <div className="flex-1 text-xs md:text-sm font-medium truncate">
                                {prop.name}
                            </div>
                            
                            {/* Houses Indicator (if any) */}
                            {prop.houses > 0 && (
                                <div className="flex items-center gap-0.5 text-yellow-500">
                                    <Home size={10} />
                                    <span className="text-[10px] font-regular">{prop.houses}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {myProperties.length === 0 && <div className="text-center text-xs text-slate-600 py-4 italic">কোনো সম্পত্তি নেই</div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;