# Train/Bus Arrivals Table

A simple, clean UI to display arrival times for buses and trains.

## Features

- Clean, minimalist table design
- Displays route numbers, station names, and arrival times
- Uses Helvetica typeface
- Mobile-friendly layout
- Ready for real-time data integration

## Usage

1. Open `index.html` in any web browser to view the static demo
2. When ready to integrate with real data:
   - Modify the `script.js` file to fetch and process your real-time data
   - Uncomment the refresh function to enable automatic updates
   - Update the data structure to match your API response format

## Data Structure

The table expects data in the following format:

```javascript
[
  { route: 'B52', station: 'Main Street', arrival: '5 min' },
  { route: 'A12', station: 'Central Park', arrival: '7 min' },
  // Additional routes...
]
```

## Customization

- Colors and styles can be modified in `styles.css`
- Table layout can be adjusted in `index.html`
- Update frequency can be changed in the `setInterval` function in `script.js` 