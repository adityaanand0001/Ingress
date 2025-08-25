import React from 'react';

const ScrollArea = ({ children, className = '', ...props }) => (
  <div className={`scroll-area ${className}`} {...props}>
    {children}
  </div>
);

export default ScrollArea;
