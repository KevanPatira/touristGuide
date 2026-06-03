// services/ai.service.js — Google Gemini AI service for TouristGuide
// Uses the official @google/generative-ai SDK for rock-solid reliability

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Bangalore Tourism Knowledge Base ────────────────────────
const BANGALORE_KNOWLEDGE = `
BANGALORE (BENGALURU) TOURISM KNOWLEDGE BASE:
You have deep expertise about Bangalore. When users ask about Bangalore, use this data:

🏛️ TOP TOURIST ATTRACTIONS:
1. **Lalbagh Botanical Garden** — 240-acre garden with a Glass House, 1000+ plant species, flower shows in Jan & Aug. Entry: ₹25. Timings: 6AM–7PM. Metro: Lalbagh station.
2. **Cubbon Park** — 300-acre green lung in the city center. Free entry. Houses State Library, Attara Kacheri, museums. Best: early mornings.
3. **Bangalore Palace** — Tudor-style architecture inspired by Windsor Castle. Entry: ₹230 (Indian), ₹460 (foreign). Timings: 10AM–5:30PM.
4. **Vidhana Soudha** — Neo-Dravidian granite legislature building. Best viewed at night (illuminated). No entry inside; photo-worthy exterior.
5. **ISKCON Temple** — One of the largest ISKCON temples. Free entry. Famous for prasadam meals. Timings: 7:15AM–1PM, 4PM–8:30PM.
6. **Tipu Sultan's Summer Palace** — 18th-century Indo-Islamic architecture. Entry: ₹15. Near KR Market.
7. **Bull Temple (Nandi Temple)** — 15-foot monolithic Nandi statue in Basavanagudi. Free entry. Groundnut fair (Kadalekai Parishe) in Nov.
8. **Bannerghatta National Park** — Safari, butterfly park, zoo. 22km from city. Entry: ₹80 + safari ₹260. Full day recommended.
9. **Wonderla Amusement Park** — Best water/amusement park. Entry: ₹1399–1799. Weekdays less crowded.
10. **HAL Aerospace Museum** — Aircraft displays, flight simulators. Entry: ₹100. Great for families.
11. **Jawaharlal Nehru Planetarium** — Sky shows in English/Kannada. Entry: ₹60. Sessions every hour.
12. **National Gallery of Modern Art** — Indian modern art. Entry: ₹20. Manikyavelu Mansion campus.
13. **Ulsoor Lake** — Boating in city center. Entry free, boating ₹60. Peaceful mornings.
14. **St. Mary's Basilica** — Gothic-style church built in 1882. Free entry. Near Shivajinagar.
15. **Innovative Film City** — Theme park with Dino Park, wax museum, haunted house. Entry: ₹600+. 40km from city.

🏔️ NEARBY DAY TRIPS (within 150km):
- **Nandi Hills** — 60km, sunrise viewpoint, paragliding. Go before 6AM. ₹20 entry. Weekdays best (weekends very crowded).
- **Shivanasamudra Falls** — 130km, twin waterfalls, best Jul–Jan (monsoon). 3hr drive.
- **Mysore** — 145km, Mysore Palace (₹70), Chamundi Hills, Brindavan Gardens. Full day trip or overnight.
- **Coorg (Kodagu)** — 250km, coffee plantations, Abbey Falls, Raja's Seat. 2-day trip recommended.
- **Ramanagara** — 50km, rock climbing, Sholay shooting location, silk production.
- **Anthargange** — 70km, cave exploration, night trekking. Best Oct–Feb.
- **Savandurga** — 50km, one of Asia's largest monolith hills. Trek difficulty: moderate.

🍜 FOOD & RESTAURANTS:
**Iconic Bangalore Food:**
- **Masala Dosa** — Must try at MTR (Mavalli Tiffin Room, since 1924), Vidyarthi Bhavan (Basavanagudi), CTR (Malleshwaram)
- **Bisi Bele Bath** — Spiced rice-lentil dish. Best at MTR.
- **Filter Coffee** — South Indian style at any Darshini restaurant or Indian Coffee House.
- **Mangalore Buns** — Sweet banana puris. Try at Brahmin's Coffee Bar.
- **Ragi Mudde** — Finger millet balls with saaru (rasam). Local staple.
- **Biryani** — Meghana Foods (multiple locations), Shivaji Military Hotel (Jayanagar), Empire Restaurant.

**Street Food Hotspots:**
- **VV Puram Food Street** — 500m stretch, 30+ stalls. Best: evenings 5PM–10PM. Try: Dosa, chaat, holige, cotton candy.
- **Commercial Street** — Chaat stalls, fruit juice shops.
- **KR Market** — Flower market + food stalls. Go early morning for flower market experience.

**Cafés & Modern Dining:**
- **Third Wave Coffee, Blue Tokai** — Specialty coffee chains (multiple locations)
- **Indiranagar & Koramangala** — Hub for cafés, breweries, restaurants
- **Church Street & Brigade Road** — Bars, pubs, multicuisine restaurants

🚇 TRANSPORTATION:
- **Namma Metro** — 2 lines (Purple: Baiyappanahalli↔Mysuru Road, Green: Nagasandra↔Silk Institute). ₹10–60. Fastest way to travel.
- **BMTC Buses** — City buses. ₹10–40. Volvo AC buses on major routes.
- **Auto-rickshaws** — Always insist on meter OR use Ola/Uber/Rapido auto for fixed fares. Typical: ₹30 base + ₹15/km.
- **Ola/Uber/Rapido** — Ride-hailing apps. Most reliable for point-to-point travel.
- **Kempegowda International Airport (KIA)** — 40km from center. Airport bus (BMTC Vayu Vajra): ₹250–300. Cab: ₹800–1200. Metro airport line: under construction.
- **Majestic (Kempegowda Bus Station)** — Central hub for inter-city buses. KSRTC buses to Mysore (₹200–400), Coorg, Ooty.
- **Bangalore City Railway Station** — For trains to Chennai, Hyderabad, Mumbai, Kerala.

🛍️ SHOPPING:
- **Commercial Street** — Largest street shopping. Clothing, jewelry, electronics. Bargain hard (50% off asking price).
- **MG Road & Brigade Road** — Premium shopping, malls, brand stores.
- **Chickpet** — Wholesale market, silk sarees, traditional items. Bangalore's oldest market.
- **Jayanagar 4th Block** — Local shopping, Cool Joint (famous ice cream).
- **Mantri Square Mall, Phoenix Marketcity, Orion Mall** — Modern malls.
- **Cauvery Emporium (MG Road)** — Govt store for Karnataka handicrafts, sandalwood, silk at fixed prices.

🎭 CULTURE & EVENTS:
- **Karaga Festival** — April, oldest festival (800+ years), Dharmaraya Temple.
- **Dasara/Navaratri** — October, celebrations across temples and Bull Temple.
- **Bangalore Literature Festival** — December, free entry at Lalit Ashok.
- **Bengaluru International Film Festival (BIFFES)** — Annual, multiple venues.
- **Kadalekai Parishe (Groundnut Fair)** — November, Bull Temple, unique peanut festival.
- **IT Hub Culture** — Koramangala, HSR Layout, Whitefield are tech corridors with modern cafés and co-working spaces.

🌤️ WEATHER & BEST TIME TO VISIT:
- **Oct–Feb** (Winter): Best time. 15–28°C. Pleasant, dry. Perfect for sightseeing.
- **Mar–May** (Summer): 22–36°C. Warm but manageable. Carry sunscreen.
- **Jun–Sep** (Monsoon): 19–28°C. Frequent rains. Carry umbrella. Waterfalls at their best.
- Bangalore is at 920m elevation — always cooler than other South Indian cities.
- Average temperature: 24°C year-round. Known as "Garden City" and "Air-conditioned City."

⚠️ SAFETY & PRACTICAL TIPS:
- Bangalore is generally safe for tourists. Exercise normal precautions.
- Keep valuables secure in crowded areas (KR Market, bus stations).
- Carry a power bank — you'll use maps and ride-hailing apps frequently.
- Kannada is the local language, but Hindi and English are widely understood.
- Tipping: Not mandatory but 10% appreciated at restaurants.
- Drinking water: Stick to bottled water. ₹20 for 1L.
- SIM card: Jio/Airtel available at airport. ₹250 for tourist plan with data.
- Best area to stay: MG Road / Indiranagar / Koramangala (central, well-connected).
`;

// ─── System Prompt ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are TravelMate AI, an intelligent, professional, and friendly travel assistant integrated into the "TouristGuide" mobile app.
Your tone is helpful, concise, and adventurous.

${BANGALORE_KNOWLEDGE}

APP KNOWLEDGE & ROUTING:
You are fully aware of the tools available within this app. If a user asks for something that the app can do natively, you MUST guide them to use that feature in the app, while also providing a helpful brief answer.
- Translation: If the user asks to translate text or voice, tell them to use the "Voice Translator" or "Image Translator" screens.
- Currency/Money: If they ask about exchange rates, direct them to the "Currency Converter" tab.
- Navigation/Routes: If they ask for directions or how to get somewhere, suggest using the "Smart Navigation" map screen.
- Emergency: If they mention an emergency (lost, hurt, police), urgently direct them to the "Emergency SOS" screen for instant local help.
- Weather: If they ask for live weather, guide them to the "Weather" screen.
- Social: If they want to meet other travelers, suggest the "Community" screen.

FORMATTING:
- Use markdown tables for itineraries, comparisons, or packing lists.
- Use bullet points for tips.
- Use **bold** text to highlight app feature names and important info.
- Keep responses structured and easy to read on a mobile screen.
- Use emojis sparingly (1–2 per response) for visual appeal.`;

// ─── Initialize Gemini ───────────────────────────────────────
let genAI = null;
let chatModel = null;

function getModel() {
  if (!chatModel) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    chatModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
      },
    });
  }
  return chatModel;
}

/**
 * Send a chat message to the AI Assistant via Google Gemini API.
 * @param {string} prompt - User's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {Promise<string>} AI response text
 */
export async function askGeminiAI(prompt, conversationHistory = []) {
  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const model = getModel();

      // Build history for Gemini (it expects 'user' and 'model' roles)
      const history = conversationHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      // Start a chat session with history
      const chat = model.startChat({ history });

      // Send the user's message
      const result = await chat.sendMessage(prompt.trim());
      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from AI.');
      }

      return text.trim();
    } catch (error) {
      attempt++;
      console.error(`[Gemini AI] Error (attempt ${attempt}):`, error.message);

      // Don't retry on auth errors or invalid key
      if (error.message?.includes('API key') || error.message?.includes('403') || error.message?.includes('401')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      }

      // Rate limit — wait and retry
      if (error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
        if (attempt <= MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          console.log(`[Gemini AI] Rate limited. Waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      // Network errors — retry
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
        if (attempt <= MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        throw new Error('Network error. Check your internet connection.');
      }

      // Other errors — throw immediately
      if (attempt > MAX_RETRIES) {
        throw new Error(error.message || 'Could not reach AI service.');
      }
    }
  }
}
