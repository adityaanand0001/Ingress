import React from 'react';
import { motion} from 'framer-motion';

const Button = ({ children, variant = 'default', className = '', ...props }) => (
  <motion.button
    className={`button ${variant} ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    {children}
  </motion.button>
);


export default Button;
