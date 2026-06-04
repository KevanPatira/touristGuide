const https = require('https');
https.get('https://unsplash.com/s/photos/varanasi-ghats', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = [...data.matchAll(/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+/g)].map(m => m[0]);
    console.log([...new Set(matches)].slice(0, 5));
  });
});
