import React, { useMemo } from 'react';
import { Square, Player, SquareType } from '../../types';
import { Train, Zap, HelpCircle, AlertCircle, Droplets, Diamond, Lock, Home, Building2, User, Bot } from 'lucide-react';

interface BoardProps {
  squares: Square[];
  players: Player[];
  diceValue: number[] | null;
  isRolling: boolean;
}

// Optimization: Memoized Square Component
const BoardSquare = React.memo(({ square, owner }: { square: Square; owner?: Player }) => {
  
  // Icon Logic
  const renderIcon = () => {
    const iconClass = "w-4 h-4 md:w-6 md:h-6 text-gray-300"; 
    if (square.type === SquareType.UTILITY) {
       if (square.name.includes('ওয়াসা')) return <Droplets className={iconClass} />;
       if (square.name.includes('বিদ্যুৎ')) return <Zap className={iconClass} />;
       return <Train className={iconClass} />;
    }
    if (square.type === SquareType.CHANCE) return <HelpCircle className="w-4 h-4 md:w-7 md:h-7 text-[#f59e0b]" />;
    if (square.type === SquareType.COMMUNITY) return <AlertCircle className="w-4 h-4 md:w-7 md:h-7 text-[#3b82f6]" />;
    if (square.type === SquareType.TAX) return <Diamond className="w-4 h-4 md:w-6 md:h-6 text-gray-200" />;
    if (square.type === SquareType.GO_TO_JAIL) return <Lock className="w-4 h-4 md:w-7 md:h-7 text-red-400" />;
    if (square.type === SquareType.JAIL) return <div className="w-full h-6 md:h-10 bg-[url('https://www.svgrepo.com/show/491696/jail.svg')] bg-contain bg-no-repeat bg-center opacity-50"></div>;
    return null;
  };

  // Grid Logic (CSS Grid Tracks 1-11)
  let gridArea = {};
  if (square.id === 0) gridArea = { gridColumn: 11, gridRow: 11 };
  else if (square.id > 0 && square.id < 10) gridArea = { gridColumn: 11 - square.id, gridRow: 11 };
  else if (square.id === 10) gridArea = { gridColumn: 1, gridRow: 11 };
  else if (square.id > 10 && square.id < 20) gridArea = { gridColumn: 1, gridRow: 11 - (square.id - 10) };
  else if (square.id === 20) gridArea = { gridColumn: 1, gridRow: 1 };
  else if (square.id > 20 && square.id < 30) gridArea = { gridColumn: 1 + (square.id - 20), gridRow: 1 };
  else if (square.id === 30) gridArea = { gridColumn: 11, gridRow: 1 };
  else if (square.id > 30 && square.id < 40) gridArea = { gridColumn: 11, gridRow: 1 + (square.id - 30) };

  // Dynamic styling based on owner
  const boxStyle: React.CSSProperties = {
    ...gridArea,
    borderColor: owner ? owner.color : '#334155',
    borderWidth: owner ? '2px' : '1px',
    boxShadow: owner ? `0 0 15px 1px ${owner.color}40 inset` : 'none', 
    transition: 'all 0.5s ease-in-out',
  };

  // Layout Configuration based on Position
  let containerClass = "flex-col justify-between"; 
  let colorClass = "w-full h-[24%] border-b border-black/20";
  let contentWrapperClass = "flex-col items-center justify-between flex-1 w-full p-1";
  let contentRotation = ""; 
  let tooltipPosition = "bottom-[105%]";
  
  // CORNERS 
  if (square.id === 10) { // Jail - Bottom Left
      // Default
  } else if (square.id === 20) { // Club - Top Left
      containerClass = "flex-col rotate-180"; 
      tooltipPosition = "top-[105%]";
  } else if (square.id === 30) { // GoToJail - Top Right
      containerClass = "flex-col rotate-180"; 
      tooltipPosition = "top-[105%]";
  } else if (square.id === 0) { // Start - Bottom Right
      // Default
  }
  
 // For the left row (squares 11-19), we'll add a rotation class to the text elements
if (square.id > 10 && square.id < 20) {
    // LEFT ROW
    containerClass = "flex-row"; 
    colorClass = "h-full w-[22%] border-l border-black/20 order-2"; 
    contentWrapperClass = "flex-col-reverse items-center justify-between flex-1 h-full py-1 order-1"; 
    // Remove rotation from container, will apply to text only
    tooltipPosition = "right-[105%]"; 
}
  else if (square.id > 20 && square.id < 30) {
      // TOP ROW
      containerClass = "flex-col-reverse";
      colorClass = "w-full h-[22%] border-t border-black/20";
      contentWrapperClass = "flex-col items-center justify-between flex-1 w-full py-1";
      contentRotation = "-rotate-190";
      tooltipPosition = "-bottom-[250px]"; 
  }
  else if (square.id > 30 && square.id < 40) {
      // RIGHT ROW
      containerClass = "flex-row";
      colorClass = "h-full w-[22%] border-r border-black/20 order-1"; 
      contentWrapperClass = "flex-col-reverse items-center justify-between flex-1 h-full py-1 order-2";
      contentRotation = "rotate-90";
      tooltipPosition = "-left-[220px] bottom-1/2 translate-y-1/2";
  }
  else {
      // BOTTOM ROW (1-9)
      containerClass = "flex-col";
      colorClass = "w-full h-[22%] border-b border-black/20";
      contentWrapperClass = "flex-col items-center justify-between flex-1 w-full py-1";
      contentRotation = "";
      tooltipPosition = "top-[105%]"; 
  }

  // House positioning
  let houseContainerStyle = "top-[-6px] left-0 right-0 justify-center items-end";
  if (square.id > 10 && square.id < 20) houseContainerStyle = "right-[-6px] top-0 bottom-0 flex-col justify-center items-end";
  if (square.id > 20 && square.id < 30) houseContainerStyle = "bottom-[-6px] left-0 right-0 justify-center items-start";
  if (square.id > 30 && square.id < 40) houseContainerStyle = "left-[-6px] top-0 bottom-0 flex-col justify-center items-start";

  const isRotatedSide = ['11-19','31-39'].some(r => { 
      const [min, max] = r.split('-').map(Number);
      return square.id >= min && square.id <= max;
  });

  return (
    <div
      className={`relative bg-[#1e293b] flex select-none overflow-visible group hover:z-[100] ${containerClass}`}
      style={boxStyle}
    >
      
      
      {/* Owner Indication Overlays */}
      {owner && (
        <>
          <div className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-500 group-hover:z-[90]" style={{ backgroundColor: owner.color }} />
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-l-[8px] md:border-t-[12px] md:border-l-[12px] border-l-transparent z-10 transition-all duration-500 group-hover:z-[95]" style={{ borderTopColor: owner.color }} />
        </>
      )}

      {/* Main Content Wrapper */}
      <div className={`flex ${contentWrapperClass} z-10 relative overflow-visible`}>
        {/* Houses/Hotel Markers */}
        {square.houses > 0 && (
          <div className={`absolute flex gap-0.5 z-20 pointer-events-none ${houseContainerStyle}`}>
            {square.houses === 5 ? (
               <div className="bg-gradient-to-br from-red-500 to-red-700 text-white p-0.5 md:p-1 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.6)] border border-white/40 z-30">
                   <Building2 size={10} fill="currentColor" className="drop-shadow-sm md:w-4 md:h-4" />
               </div>
            ) : (
               Array.from({length: square.houses}).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-green-400 to-green-600 text-white p-[1px] md:p-0.5 rounded-[2px] md:rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/40" style={{animationDelay: `${i * 100}ms`}}>
                     <Home size={6} fill="currentColor" className="drop-shadow-sm md:w-[10px] md:h-[10px]" />
                  </div>
               ))
            )}
          </div>
        )}

        {/* Content */}
        <div className={`flex flex-col items-center justify-between w-full h-full ${contentRotation}`}>
            {/* Property Name - Custom rendering based on square type */}
            <div className={`flex items-center justify-center w-full px-0.5 ${isRotatedSide ? 'min-w-[4rem] md:min-w-[6rem]' : ''}`}>
                {square.type === SquareType.PROPERTY ? (
                    <div className="flex flex-col items-center w-full h-full justify-center overflow-hidden px-0.5">
                        {square.name.split(' ').map((word, i, arr) => {
                            const wordCount = square.name.split(' ').length;
                            let sizeClass = "text-[12px] md:text-[18px]"; // Default size for 1-2 words
                            if (wordCount === 1 && word.length > 12) sizeClass = "text-[10px] md:text-[14px]";
                            if (wordCount >= 3) sizeClass = "text-[9px] md:text-[12px]";
                            if (word.length > 15) sizeClass = "text-[8px] md:text-[10px]";
                            
                            return (
                                <span 
                                    key={i} 
                                    className={`${sizeClass} font-medium text-center text-gray-100 w-full break-words`}
                                    style={{ lineHeight: '1.1' }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                ) : square.type === SquareType.TAX ? (
                    <span className="text-[9px] md:text-[12px] font-medium text-center text-gray-200 leading-tight w-full px-0.5 break-words">
                        {square.name}
                    </span>
                ) : square.type === SquareType.CHANCE || square.type === SquareType.COMMUNITY ? (
                    <span className="text-[9px] md:text-[18px] font-medium text-center text-yellow-100 leading-tight w-full px-0 break-words">
                        {square.name}
                    </span>
                ) : (
                    <span className="text-[10px] md:text-[18px] font-medium text-center text-gray-100 leading-tight w-full px-0.5 break-words">
                        {square.name}
                    </span>
                )}
            </div>
            
            {/* Icon */}
            <div className="flex-shrink-0">
                {renderIcon()}
            </div>
            
            {/* Price or Tax */}
            <div className="w-full flex justify-center">
                {square.price > 0 && square.type === SquareType.PROPERTY && (
                    <div className="flex flex-col items-center">
                        <span className="text-[6px] md:text-[15px] font-medium text-yellow-100 px-1 py-0.5  rounded leading-none">
                            ৳{square.price.toLocaleString()}
                        </span>
                    </div>
                )}
                {square.type === SquareType.TAX && (
                    <div className="flex flex-col items-center">
                        <span className="text-[5px] md:text-[12px] font-medium text-red-100 px-1 py-0.5 rounded leading-none">
                            ৳{square.price.toLocaleString()}
                        </span>
                    </div>
                )}
                {square.type === SquareType.UTILITY && (
                    <div className="flex flex-col items-center">
                        <span className="text-[5px] md:text-[15px] font-regular text-white  px-1.5 py-0.5 rounded-full leading-none">
                            ৳{square.price.toLocaleString()}
                        </span>
                    </div>
                )}
                {square.type === SquareType.RAILROAD && (
                    <div className="flex flex-col items-center">
                        <span className="text-[5px] md:text-[18px] font-regular text-white  px-1.5 py-0.5 rounded-full leading-none">
                            ৳{square.price.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* RICHUP STYLE TOOLTIP - Fixed Center Position */}
      {square.type === SquareType.PROPERTY && (
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block w-72 md:w-80 bg-gradient-to-br from-[#1e1b2e] to-[#2d2a4a] text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] border border-white/10 z-[100] pointer-events-none backdrop-blur-xl"
          >
              {/* Tooltip Header with Glow */}
              <div className="relative pt-4 pb-2 text-center overflow-hidden rounded-t-xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-white/5 blur-xl rounded-full"></div>
                  <h3 className="relative font-regular text-xl leading-none tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10">{square.name}</h3>
              </div>

              {/* Rent Table */}
              <div className="px-4 py-2 text-xs md:text-sm">
                <div className="flex justify-between items-end border-b border-white/10 pb-1 mb-2">
                    <span className="text-slate-400 font-regular uppercase text-[10px] tracking-wider">when</span>
                    <span className="text-slate-400 font-regular uppercase text-[10px] tracking-wider">get</span>
                </div>
                
                <div className="grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-4">
                    <span className="text-slate-200">with rent</span>
                    <span className="text-right font-mono font-regular text-white">৳{square.rent[0]}</span>

                    <span className="text-slate-200">with one house</span>
                    <span className="text-right font-mono font-regular text-white">৳{square.rent[1]}</span>

                    <span className="text-slate-200">with two houses</span>
                    <span className="text-right font-mono font-regular text-white">৳{square.rent[2]}</span>

                    <span className="text-slate-200">with three houses</span>
                    <span className="text-right font-mono font-regular text-white">৳{square.rent[3]}</span>

                    <span className="text-slate-200">with four houses</span>
                    <span className="text-right font-mono font-regular text-white">৳{square.rent[4]}</span>

                    <div className="col-span-2 h-px bg-white/5 my-0.5"></div>

                    <span className="text-yellow-400 font-regular">with a hotel</span>
                    <span className="text-right font-mono font-regular text-yellow-400 text-base">৳{square.rent[5]}</span>
                </div>
              </div>

              {/* Footer Costs */}
              <div className="mt-2 bg-black/40 p-3 rounded-b-xl grid grid-cols-3 gap-2 border-t border-white/10">
                  <div className="flex flex-col items-center">
                       <span className="text-[9px] text-slate-400 uppercase font-regular tracking-wider mb-0.5">Price</span>
                       <span className="font-regular font-mono text-sm text-white">৳{square.price}</span>
                  </div>
                  <div className="flex flex-col items-center relative">
                       <div className="absolute left-0 top-1 bottom-1 w-px bg-white/10"></div>
                       <Home size={14} className="text-slate-300 mb-0.5" />
                       <span className="font-regular font-mono text-sm text-white">৳{square.houseCost}</span>
                       <div className="absolute right-0 top-1 bottom-1 w-px bg-white/10"></div>
                  </div>
                  <div className="flex flex-col items-center">
                       <Building2 size={14} className="text-slate-300 mb-0.5" />
                       <span className="font-regular font-mono text-sm text-white">৳{square.houseCost}</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}, (prev, next) => {
    return prev.square.id === next.square.id && 
           prev.owner === next.owner && 
           prev.square.houses === next.square.houses &&
           prev.square.isMortgaged === next.square.isMortgaged;
});

// Separate Center Area
const CenterArea = React.memo(({ diceValue, isRolling }: { diceValue: number[] | null, isRolling: boolean }) => {
    return (
        <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-[#0f172a] flex flex-col items-center justify-center relative bg-[url('https://i.ibb.co.com/bjR5hhZ1/unnamed.jpg')] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] h-[auto] bg-repeat-0 bg-center bg-cover blur-[0px]  ">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="text-4xl md:text-8xl font-black text-white transform -rotate-12 tracking-widest text-center font-['Hind_Siliguri'] leading-tight">
                    
                </div>
            </div>

            <div className="z-10 flex flex-col items-center mt-2 md:mt-8">
                {diceValue ? (
                    <div className={`flex gap-2 md:gap-4 mb-2 md:mb-4 transform transition-all duration-300 ${isRolling ? 'scale-110 animate-shake' : 'scale-125'}`}>
                        <div className="w-8 h-8 md:w-20 md:h-20 bg-gradient-to-br from-white to-gray-200 rounded-lg md:rounded-xl shadow-[0_2px_0_#94a3b8] md:shadow-[0_4px_0_#94a3b8] flex items-center justify-center text-xl md:text-6xl font-regular text-black border border-gray-300">
                            {diceValue[0]}
                        </div>
                        <div className="w-8 h-8 md:w-20 md:h-20 bg-gradient-to-br from-white to-gray-200 rounded-lg md:rounded-xl shadow-[0_2px_0_#94a3b8] md:shadow-[0_4px_0_#94a3b8] flex items-center justify-center text-xl md:text-6xl font-regular text-black border border-gray-300">
                            {diceValue[1]}
                        </div>
                    </div>
                ) : (
                        <div className="text-slate-500 text-[10px] md:text-sm mb-4 animate-pulse font-['Hind_Siliguri'] bg-slate-900/80 px-2 md:px-4 py-1 rounded-full border border-slate-700">
                        অপেক্ষা...
                        </div>
                )}
            </div>
        </div>
    );
});

// Helper to calculate top/left percentage based on Non-Uniform Grid
const getBoardPosition = (index: number) => {
    const cornerSize = 1.3;
    const propSize = 1;
    const totalUnits = (cornerSize * 2) + (9 * propSize);
    
    const cornerPct = (cornerSize / totalUnits) * 100;
    const propPct = (propSize / totalUnits) * 100;

    let top = "0%";
    let left = "0%";
    let width = `${propPct}%`;
    let height = `${propPct}%`;

    if (index === 0) { // START
        top = `${100 - cornerPct}%`;
        left = `${100 - cornerPct}%`;
        width = `${cornerPct}%`;
        height = `${cornerPct}%`;
    } 
    else if (index > 0 && index < 10) { // BOTTOM ROW
        top = `${100 - cornerPct}%`;
        left = `${cornerPct + (9 - index) * propPct}%`;
        width = `${propPct}%`;
        height = `${cornerPct}%`;
    }
    else if (index === 10) { // JAIL
        top = `${100 - cornerPct}%`;
        left = "0%";
        width = `${cornerPct}%`;
        height = `${cornerPct}%`;
    }
    else if (index > 10 && index < 20) { // LEFT ROW
        const adjustedTop = cornerPct + (19 - index) * propPct;
        top = `${adjustedTop}%`;
        left = "0%";
        width = `${cornerPct}%`;  
        height = `${propPct}%`; 
    }
    else if (index === 20) { // CLUB
        top = "0%";
        left = "0%";
        width = `${cornerPct}%`;
        height = `${cornerPct}%`;
    }
    else if (index > 20 && index < 30) { // TOP ROW
        top = "0%";
        left = `${cornerPct + (index - 21) * propPct}%`;
        width = `${propPct}%`;
        height = `${cornerPct}%`;
    }
    else if (index === 30) { // GO TO JAIL
        top = "0%";
        left = `${100 - cornerPct}%`;
        width = `${cornerPct}%`;
        height = `${cornerPct}%`;
    }
    else if (index > 30 && index < 40) { // RIGHT ROW
        top = `${cornerPct + (index - 31) * propPct}%`;
        left = `${100 - cornerPct}%`;
        width = `${cornerPct}%`;
        height = `${propPct}%`;
    }

    return { top, left, width, height };
};

export const Board: React.FC<BoardProps> = ({ squares, players, diceValue, isRolling }) => {
  
  const ownersMap = useMemo(() => {
      const map: Record<number, Player | undefined> = {};
      squares.forEach(sq => {
          if (sq.ownerId) {
              map[sq.id] = players.find(p => p.id === sq.ownerId);
          }
      });
      return map;
  }, [squares, players]);

  return (
    <div className="w-full h-full p-0 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-h-[100vw] max-w-[100vw] bg-[#0f172a] border-2 md:border-4 border-[#334155] rounded-lg shadow-2xl relative m-0">
        <div 
            className="w-full h-full grid gap-[1px] bg-[#475569]"
            style={{
                gridTemplateColumns: '1.2fr repeat(9, 1fr) 1.2fr',
                gridTemplateRows: '1.2fr repeat(9, 1fr) 1.2fr'
            }}
        >
            <CenterArea diceValue={diceValue} isRolling={isRolling} />
            {squares.map((sq) => (
                <BoardSquare
                    key={sq.id}
                    square={sq}
                    owner={ownersMap[sq.id]}
                />
            ))}
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
             {players.map((p, idx) => {
                 const posStyle = getBoardPosition(p.position);
                 const jitterX = (idx % 3) * 3 - 3; 
                 const jitterY = (idx % 2) * 3 - 1.5;

                 return (
                     <div
                        key={p.id}
                        className="absolute flex items-center justify-center transition-all duration-150 ease-linear z-50 will-change-transform"
                        style={{
                            top: posStyle.top,
                            left: posStyle.left,
                            width: posStyle.width,
                            height: posStyle.height,
                        }}
                     >
                         <div 
                             className="w-5 h-5 md:w-10 md:h-10 rounded-full border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.9)] flex items-center justify-center bg-gradient-to-br from-white/30 to-transparent relative"
                             style={{ 
                                 backgroundColor: p.color,
                                 transform: `translate(${jitterX * 0.5}px, ${jitterY * 0.5}px)` 
                             }}
                         >
                            {p.isAi ? <Bot size={14} className="text-white drop-shadow-md md:w-5 md:h-5" /> : <User size={14} className="text-white drop-shadow-md md:w-5 md:h-5" />}
                            <div className="absolute inset-0 rounded-full border border-black/20" />
                         </div>
                     </div>
                 );
             })}
        </div>

      </div>
    </div>
  );
};