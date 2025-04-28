import React from 'react';
import { type Player } from '@shared/schema';
import { PixelBorder } from '@/components/ui/pixel-border';
import StatBar from '@/components/ui/stat-bar';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onClick, 
  isSelected = false,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: {
      container: "w-16 h-16",
      image: "w-12 h-12",
      name: "text-[10px]"
    },
    medium: {
      container: "w-full",
      image: "w-1/3",
      name: "text-xs"
    },
    large: {
      container: "w-full",
      image: "w-24 h-24",
      name: "text-sm"
    }
  };

  if (size === 'small') {
    return (
      <div className={`player-card-small flex flex-col items-center ${isSelected ? 'selected' : ''}`} onClick={onClick}>
        <div className="relative">
          <PixelBorder>
            <img 
              src={player.avatarUrl} 
              alt={`${player.name}`} 
              className={`object-cover ${sizeClasses.small.image}`}
            />
          </PixelBorder>
          <div className="absolute bottom-0 left-0 right-0 bg-black text-center font-arcade py-1 text-[10px]">
            {player.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`selected-player flex ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className={`player-image ${sizeClasses[size].image} relative`}>
        <PixelBorder>
          <img 
            src={player.avatarUrl} 
            alt={`${player.name}`} 
            className="w-full h-full object-cover"
          />
        </PixelBorder>
        <div className="absolute bottom-0 left-0 right-0 bg-black text-center font-arcade py-1 text-xs">
          {player.name}
        </div>
      </div>
      <div className="player-stats w-2/3 pl-2 flex flex-col justify-center">
        <div className="stat mb-2">
          <div className="flex justify-between text-xs font-digital mb-1">
            <span>SPEED</span>
            <span>{player.speed}</span>
          </div>
          <StatBar value={player.speed} maxValue={10} />
        </div>
        <div className="stat">
          <div className="flex justify-between text-xs font-digital mb-1">
            <span>POWER</span>
            <span>{player.power}</span>
          </div>
          <StatBar value={player.power} maxValue={10} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
