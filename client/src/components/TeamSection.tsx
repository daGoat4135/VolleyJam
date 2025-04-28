import React from 'react';
import { type Player } from '@shared/schema';
import PlayerCard from './PlayerCard';
import { playSound } from '@/assets/arcadeSounds';

interface TeamSectionProps {
  division: 'east' | 'west';
  players: Player[];
  teams: string[];
  selectedPlayers: Player[];
  onPlayerSelect: (player: Player) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({ 
  division, 
  players, 
  teams,
  selectedPlayers, 
  onPlayerSelect 
}) => {
  const isWest = division === 'west';
  const headerColor = isWest ? 'from-[#FF4D4D]' : 'from-[#4169E1]';
  const borderColor = isWest ? 'border-[#4169E1]' : 'border-[#FF4D4D]';
  const textColor = isWest ? 'text-[#4169E1]' : 'text-[#FF4D4D]';
  const highlightColor = isWest ? 'text-[#FFD700]' : 'text-[#4169E1]';
  
  // Group players by team
  const playersByTeam: Record<string, Player[]> = {};
  players.forEach(player => {
    if (!playersByTeam[player.team]) {
      playersByTeam[player.team] = [];
    }
    playersByTeam[player.team].push(player);
  });

  const handleTeamClick = (team: string) => {
    playSound('select');
    // You could implement team selection logic here
  };

  const handlePlayerClick = (player: Player) => {
    playSound('select');
    onPlayerSelect(player);
  };

  return (
    <div className={`${division}-division`}>
      <div className={`team-header bg-gradient-to-r ${headerColor} to-transparent p-3 mb-4`}>
        <h3 className="font-arcade text-xl">{division.toUpperCase()}</h3>
      </div>
      
      {/* Team Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {teams.map((team) => (
          <div 
            key={team}
            className="player-card p-2 rounded cursor-pointer" 
            data-team={team.toLowerCase().replace(' ', '-')}
            onClick={() => handleTeamClick(team)}
          >
            <div className={`text-center font-arcade text-xs ${highlightColor} mb-1`}>
              {team}
            </div>
          </div>
        ))}
      </div>
      
      {/* Player Selection */}
      <div className={`player-selection bg-gradient-to-r from-black to-gray-900 p-3 border-2 ${borderColor}`}>
        <h4 className={`font-arcade text-sm mb-4 ${textColor}`}>SELECTED PLAYERS</h4>
        
        <div className="grid grid-cols-2 gap-4">
          {selectedPlayers.map((player, index) => (
            <PlayerCard 
              key={`${player.id}-${index}`} 
              player={player} 
              onClick={() => handlePlayerClick(player)}
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
