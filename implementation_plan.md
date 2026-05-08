# Google Maps-Style Search System for Smart Navigation

The current search in [SmartNavigationScreen.js](file:///c:/Users/Kevan%20Patira/Documents/ReactWorkshop/madApp/screens/SmartNavigationScreen.js) uses plain text inputs with a small hardcoded `FAKE_PLACES` dictionary (5 places) and quick-pick chips. The user must type an exact place name or tap a chip — there's no autocomplete, no search suggestions, and no visual dropdown. This change will make the search feel like Google Maps.

## Proposed Changes

### SmartNavigationScreen

#### [MODIFY] [SmartNavigationScreen.js](file:///c:/Users/Kevan%20Patira/Documents/ReactWorkshop/madApp/screens/SmartNavigationScreen.js)

**1. Expanded places database (~30+ places with categories)**
- Add many more places across categories (landmarks, restaurants, hotels, parks, museums, transport hubs, etc.)
- Each place gets [lat](file:///c:/Users/Kevan%20Patira/Documents/ReactWorkshop/madApp/screens/SmartNavigationScreen.js#56-71), `lng`, `category`, and an `icon` for visual display

**2. Google Maps-style autocomplete dropdown**
- When the user types in the From or To field, a floating dropdown overlay appears below the input
- Shows matching places filtered by what the user has typed (fuzzy/substring match)
- Each suggestion row shows: category icon, place name, and category label
- Tapping a suggestion fills the input and dismisses the dropdown
- An "📍 Use My Location" row at top of the From dropdown
- "Recent searches" section shown when the input is focused but empty

**3. Search-as-you-type**
- `fromSuggestions` and `toSuggestions` state arrays driven by `onChangeText`
- Fuzzy matching: case-insensitive substring match on place name
- With debounce feel (instant filtering since data is local)

**4. Recent searches with AsyncStorage**
- Save the last 5 searched destinations to `AsyncStorage`
- Show them in the dropdown when the field is focused but empty
- Each recent item has a clock icon

**5. Google Maps-style search bar on map**
- Move the search UI to overlay on the top of the map (compact search bar)
- When tapped, expand into the full From/To input panel with the autocomplete dropdown
- Back arrow to collapse

**6. Visual polish**
- Dropdown has subtle shadow/elevation, rounded corners, dark glass theme
- Highlight matching text in suggestions (bold the matched substring)
- Smooth entry animation for the dropdown
- Dividers between suggestion rows

## Verification Plan

### Manual Verification
1. Run the app with `npx expo start` and open on a device/emulator
2. Navigate to the Smart Navigation tab
3. **Test autocomplete**: Tap the "To" field and start typing "Ei" → should see "Eiffel Tower" suggestion appear
4. **Test suggestion tap**: Tap a suggestion → field should be filled, dropdown should dismiss
5. **Test From field**: Clear the From field → should see "Use My Location" option at top of dropdown
6. **Test recent searches**: Search for a route, then tap the To field again when empty → should see the previously searched destination under "Recent"
7. **Test the map search bar**: The search bar should overlay on the map, and tapping it should expand the full search panel
8. **Test route still works**: After selecting From/To via autocomplete, tap "Find Route" → route should display correctly as before
