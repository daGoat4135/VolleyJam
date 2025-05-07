import React from 'react';
import { type Player } from '@shared/schema';
import PlayerCard from './PlayerCard';
import { playSound } from '@/assets/arcadeSounds';

interface TeamSectionProps {
  division: 'east' | 'west';
  players: Player[];
  selectedPlayers: Player[];
  onPlayerSelect: (player: Player) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({ 
  division, 
  players, 
  selectedPlayers, 
  onPlayerSelect 
}) => {
  const isWest = division === 'west';
  const headerColor = isWest ? 'from-[#FF4D4D]' : 'from-[#4169E1]';
  const borderColor = isWest ? 'border-[#FF4D4D]' : 'border-[#4169E1]';
  const textColor = isWest ? 'text-[#FF4D4D]' : 'text-[#4169E1]';

  const handlePlayerClick = (player: Player) => {
    playSound('select');
    onPlayerSelect(player);
  };

  const isPlayerSelected = (player: Player) => {
    return selectedPlayers.some(p => p.id === player.id);
  };

  return (
    <div className={`${division}-division`}>
      <div className={`team-header bg-gradient-to-r ${headerColor} to-transparent p-3 mb-4`}>
        <h3 className="font-arcade text-xl">{division.toUpperCase()}</h3>
      </div>

      {/* Available Players Grid */}
      <div className={`available-players p-3 border-2 ${borderColor} mb-6`}>
        <h4 className={`font-arcade text-sm mb-4 ${textColor}`}>ALL PLAYERS</h4>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...players]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((player) => (
            <div 
              key={player.id}
              className={`player-item p-2 cursor-pointer transition-colors duration-200 tap-highlight ${
                isPlayerSelected(player) ? 'bg-[#FFD700]/20' : 'hover:bg-gray-800'
              }`}
              onClick={() => handlePlayerClick(player)}
              onTouchStart={() => {}} 
              role="button"
              tabIndex={0}
            >
              <PlayerCard 
                player={player} 
                size="small" 
                isSelected={isPlayerSelected(player)}
              />
              <div className="text-center font-arcade text-xs mt-2">{player.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Players */}
      <div className={`player-selection bg-gradient-to-r from-black to-gray-900 p-3 border-2 ${borderColor}`}>
        <h4 className={`font-arcade text-sm mb-4 ${textColor}`}>SELECTED PLAYERS</h4>

        <div className="grid grid-cols-2 gap-4">
          {selectedPlayers.map((player, index) => (
            <PlayerCard 
              key={`${player.id}-${index}`} 
              player={player} 
              onClick={() => handlePlayerClick(player)}
              isSelected={true}
            />
          ))}

          {/* Fill in empty slots */}
          {Array.from({ length: 2 - selectedPlayers.length }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] border border-dashed border-gray-700 rounded flex items-center justify-center">
              <span className="font-arcade text-xs text-gray-600">SELECT PLAYER</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSection;