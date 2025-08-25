export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

export const getApiUrl = (path) => `${API_BASE_URL}${path}`
