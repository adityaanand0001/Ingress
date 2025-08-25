import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({ trigger, items, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className={`flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors border rounded-md focus:outline-none ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 active:bg-gray-100'
        }`}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        {trigger}
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg">
          {items.map((item, index) => (
            <button
              key={index}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

CustomDropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
    })
  ).isRequired,
  disabled: PropTypes.bool,
};

CustomDropdown.defaultProps = {
  disabled: false,
};

export default CustomDropdown;

