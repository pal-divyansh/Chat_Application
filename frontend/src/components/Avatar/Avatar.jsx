// src/components/Avatar/Avatar.jsx
import React from 'react';
import './Avatar.css';

const Avatar = ({ 
  src, 
  name = 'User', 
  size = 40, 
  round = true, 
  className = '',
  ...props 
}) => {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: round ? '50%' : '4px',
    fontSize: `${size * 0.4}px`,
    lineHeight: `${size}px`,
  };

  return (
    <div 
      className={`avatar ${className}`} 
      style={style}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="avatar-image" 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {!src && (
        <div className="avatar-initials">
          {initials}
        </div>
      )}
    </div>
  );
};

export default Avatar;