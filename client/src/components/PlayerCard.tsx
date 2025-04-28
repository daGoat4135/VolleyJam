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

  // Common props for all player card sizes
  const commonProps = {
    onClick,
    role: "button",
    tabIndex: 0,
    onTouchStart: () => {}, /* Empty handler to activate active state on iOS */
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    }
  };

  const selectedBorderColor = isSelected ? 'border-[#FFD700]' : 'border-transparent';
  const selectedGlow = isSelected ? 'shadow-glow shadow-[#FFD700]' : '';

  if (size === 'small') {
    return (
      <div 
        className={`player-card-small flex flex-col items-center cursor-pointer 
                   ${isSelected ? 'selected' : ''} ${selectedGlow}`}
        {...commonProps}
      >
        <div className={`relative border-2 ${selectedBorderColor} rounded transition-all duration-200`}>
          <PixelBorder color={isSelected ? '#FFD700' : '#4169E1'}>
            <img 
              src={player.avatarUrl} 
              alt={`${player.name}`} 
              className={`object-cover ${sizeClasses.small.image}`}
            />
          </PixelBorder>
          <div className={`absolute bottom-0 left-0 right-0 bg-black text-center font-arcade py-1 text-[10px] 
                         ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
            {player.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`selected-player flex p-2 cursor-pointer transition-all duration-200
                ${isSelected ? 'selected bg-black/50' : ''} 
                ${selectedGlow} border-2 ${selectedBorderColor} rounded`}
      {...commonProps}
    >
      <div className={`player-image ${sizeClasses[size].image} relative`}>
        <PixelBorder color={isSelected ? '#FFD700' : '#4169E1'}>
          <img 
            src={player.avatarUrl} 
            alt={`${player.name}`} 
            className="w-full h-full object-cover"
          />
        </PixelBorder>
        <div className={`absolute bottom-0 left-0 right-0 bg-black text-center font-arcade py-1 text-xs
                       ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
          {player.name}
        </div>
      </div>
      <div className="player-stats w-2/3 pl-2 flex flex-col justify-center">
        <div className="stat mb-2">
          <div className="flex justify-between text-xs font-digital mb-1">
            <span>SPEED</span>
            <span>{player.speed}</span>
          </div>
          <StatBar value={player.speed} maxValue={10} color={isSelected ? 'linear-gradient(90deg, #FFD700, #ffd900)' : 'linear-gradient(90deg, #4169E1, #8ca9ff)'} />
        </div>
        <div className="stat">
          <div className="flex justify-between text-xs font-digital mb-1">
            <span>POWER</span>
            <span>{player.power}</span>
          </div>
          <StatBar value={player.power} maxValue={10} color={isSelected ? 'linear-gradient(90deg, #FFD700, #ffd900)' : 'linear-gradient(90deg, #4169E1, #8ca9ff)'} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
