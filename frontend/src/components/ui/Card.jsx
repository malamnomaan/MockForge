import React from 'react';


export default function Card({ children, className = '', hover = true }) {
  return (
    <div className={`glass glass-card ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
