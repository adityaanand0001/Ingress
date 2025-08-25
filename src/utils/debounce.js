export function debounce(func, wait) {
    let timeout = 1;
  
    return (...args) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  