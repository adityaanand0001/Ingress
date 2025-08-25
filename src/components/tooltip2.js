import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './tooltip.css';

const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  const updatePosition = () => {
    if (tooltipRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Calculate center position by default
      let x = -(tooltipRect.width - containerRect.width) / 2;
      let y = containerRect.height + 8; // 8px gap

      // Check if tooltip would go beyond right edge
      if (containerRect.left + x + tooltipRect.width > viewport.width) {
        x = -(tooltipRect.width - containerRect.width);
      }
      
      // Check if tooltip would go beyond left edge
      if (containerRect.left + x < 0) {
        x = 0;
      }

      // Check if tooltip would go beyond bottom edge
      if (containerRect.bottom + y + tooltipRect.height > viewport.height) {
        // Position above the element
        y = -(tooltipRect.height + 8);
      }

      setTooltipPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="tooltip-content"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;