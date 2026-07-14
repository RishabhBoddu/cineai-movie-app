import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ initialRating = 0, onRate, size = 5 }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    setRating(value);
    if (onRate) {
      onRate(value);
    }
  };

  const handleMouseEnter = (value) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: size }).map((_, idx) => {
        const starValue = idx + 1;
        const isActive = hoverRating ? starValue <= hoverRating : starValue <= rating;
        
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className="p-1 text-neutral-600 hover:scale-115 active:scale-95 transition-all duration-150 cursor-pointer outline-none"
            title={`Rate ${starValue} Star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-6 h-6 stroke-1.5 transition-all duration-150 ${
                isActive 
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="text-xs font-bold text-amber-400 ml-2">
          {rating.toFixed(1)} / 5.0
        </span>
      )}
    </div>
  );
};

export default StarRating;
