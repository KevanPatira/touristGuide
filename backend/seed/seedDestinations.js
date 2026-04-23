// seed/seedDestinations.js — Script to populate initial destinations data
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Destination = require('../models/Destination');

// In case the frontend file uses ES modules, we need to adapt it, or just copy the raw data.
// Here we'll read and mock export.
const fs = require('fs');
const path = require('path');

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing destinations...');
    await Destination.deleteMany({});

    console.log('Loading local data...');
    // A quick hack to require ES module data
    const dataPath = path.join(__dirname, '..', '..', 'data', 'indiaPlaces.js');
    let rawContent = fs.readFileSync(dataPath, 'utf8');
    
    // Convert ES6 export to CommonJS
    rawContent = rawContent.replace(/export const INDIA_PLACES/g, 'const INDIA_PLACES');
    rawContent = rawContent.replace(/export const INDIA_STATES/g, 'const INDIA_STATES');
    rawContent += '\nmodule.exports = INDIA_PLACES;';
    
    // Write temp file
    const tempFile = path.join(__dirname, 'tempPlaces.js');
    fs.writeFileSync(tempFile, rawContent);
    
    // Require temp file
    const indiaPlaces = require('./tempPlaces');
    
    const formattedDestinations = indiaPlaces.map(place => ({
      name: place.name,
      country: 'India',
      state: place.state,
      city: place.city || '',
      description: place.description || '',
      category: Array.isArray(place.category) ? place.category[0].toLowerCase() : place.category.toLowerCase(),
      location: {
        type: 'Point',
        coordinates: [place.lng, place.lat]
      },
      tags: [place.state, place.category],
      averageRating: 4.5,
      reviewCount: 0,
      featured: place.rank <= 3, // Top 3 from each state become featured
      coverImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(place.name)}&background=random`,
      rank: place.rank
    }));

    console.log(`Inserting ${formattedDestinations.length} destinations...`);
    await Destination.insertMany(formattedDestinations);

    // Clean up
    fs.unlinkSync(tempFile);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
