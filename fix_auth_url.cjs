const fs = require('fs');

let c = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');

const getApiUrlLogic = `
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }
  return '/api';
};
const API_URL = getApiUrl();
`;

c = c.replace(/const API_URL = [^\n]+;/, getApiUrlLogic);
fs.writeFileSync('src/contexts/AuthContext.jsx', c);
