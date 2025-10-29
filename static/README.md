# Master Naturalist Color Vocabulary PWA

A Progressive Web App (PWA) that allows Master Naturalists to explore and learn color vocabulary through an interactive color wheel interface.

## Features

- **Interactive Color Wheel**: Touch-enabled canvas for selecting color ranges
- **Multiple Datasets**: Switch between Master Naturalist and Rayner Mycological color vocabularies
- **Touch Support**: Draw circles on the color wheel with your finger (mobile-friendly)
- **Vocabulary Cards**: View matching color terms with descriptions and color swatches
- **Anki Export**: Export selected vocabulary cards to CSV format for spaced repetition apps like Anki
- **Offline Support**: Full PWA capabilities with service worker for offline use
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Installation

### Local Setup

1. Place your color vocabulary JSON files in the `data/` directory:
   - `Master_Naturalist_Color_Vocabulary.json`
   - `Rayner_Mycological_Color_Chart_Data.json`

2. Serve the `static/` directory using any web server. Examples:

   ```bash
   # Using Python 3
   cd static
   python -m http.server 8000

   # Using Node.js http-server
   npx http-server static -p 8000

   # Using PHP
   cd static
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

### Install as PWA

When accessing the app in a modern browser:
- **Desktop**: Look for the install button in the address bar
- **Mobile**: Use "Add to Home Screen" from the browser menu

## Usage

1. **Select a Dataset**: Choose between Master Naturalist or Rayner Mycological color vocabularies from the dropdown menu

2. **Select Colors on the Wheel**:
   - Use your finger (touch) or mouse to draw a circle around the colors you're interested in
   - The selected area will be highlighted

3. **Find Matching Colors**: Click the "Find Matching Colors" button to see vocabulary terms that match your selection

4. **Review Vocabulary Cards**:
   - Browse the matching color terms with their names, hex codes, RGB values, and descriptions
   - Check the boxes next to cards you want to export

5. **Export to Anki**:
   - Click "Export to CSV (Anki)" to download selected cards
   - Import the CSV file into Anki with these field mappings: Front, Back, Tags

## Data Format

Your JSON data files should follow this structure:

```json
[
  {
    "name": "Color Name",
    "hex": "#RRGGBB",
    "rgb": {"r": 0, "g": 0, "b": 0},
    "description": "Color description",
    "category": "Color category"
  }
]
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with touch support

## Files Structure

```
static/
├── index.html          # Main HTML file
├── styles.css          # Application styles
├── app.js              # Application logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline support
├── assets/             # CSS assets
│   ├── fonts.css
│   ├── henry.css
│   ├── input.css
│   └── theme.css
└── data/               # Color vocabulary data
    ├── Master_Naturalist_Color_Vocabulary.json
    └── Rayner_Mycological_Color_Chart_Data.json
```

## License

This project is designed for educational use by Master Naturalist programs.
