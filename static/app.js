// Master Naturalist Color Vocabulary PWA
// Main application logic

class ColorVocabularyApp {
    constructor() {
        this.colorWheel = document.getElementById('color-wheel');
        this.selectionOverlay = document.getElementById('selection-overlay');
        this.datasetSelect = document.getElementById('dataset-select');
        this.clearSelectionBtn = document.getElementById('clear-selection');
        this.findColorsBtn = document.getElementById('find-colors');
        this.resultsSection = document.getElementById('results-section');
        this.vocabCards = document.getElementById('vocab-cards');
        this.resultsCount = document.getElementById('results-count');
        this.selectAllBtn = document.getElementById('select-all');
        this.deselectAllBtn = document.getElementById('deselect-all');
        this.exportCsvBtn = document.getElementById('export-csv');

        this.wheelCtx = this.colorWheel.getContext('2d');
        this.overlayCtx = this.selectionOverlay.getContext('2d');

        this.isDrawing = false;
        this.selectionPath = [];
        this.selectedColors = new Set();
        this.currentData = [];
        this.matchedVocabulary = [];

        this.init();
    }

    async init() {
        await this.loadData();
        this.setupColorWheel();
        this.setupEventListeners();
        this.registerServiceWorker();
    }

    async loadData() {
        try {
            const [masterNaturalist, rayner] = await Promise.all([
                fetch('data/Master_Naturalist_Color_Vocabulary.json').then(r => r.json()),
                fetch('data/Rayner_Mycological_Color_Chart_Data.json').then(r => r.json())
            ]);

            this.datasets = {
                master_naturalist: masterNaturalist,
                rayner: rayner
            };

            this.currentData = masterNaturalist;
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading color data. Please ensure data files are in the data/ directory.');
        }
    }

    setupColorWheel() {
        const size = 500;
        this.colorWheel.width = size;
        this.colorWheel.height = size;
        this.selectionOverlay.width = size;
        this.selectionOverlay.height = size;

        this.drawColorWheel();
    }

    drawColorWheel() {
        const ctx = this.wheelCtx;
        const centerX = this.colorWheel.width / 2;
        const centerY = this.colorWheel.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, this.colorWheel.width, this.colorWheel.height);

        // Draw color wheel using HSL
        for (let angle = 0; angle < 360; angle++) {
            for (let r = 0; r < radius; r++) {
                const saturation = (r / radius) * 100;
                const lightness = 50;

                ctx.fillStyle = `hsl(${angle}, ${saturation}%, ${lightness}%)`;

                const rad = (angle * Math.PI) / 180;
                const x = centerX + r * Math.cos(rad);
                const y = centerY + r * Math.sin(rad);

                ctx.fillRect(x, y, 2, 2);
            }
        }

        // Add lightness gradient rings
        const rings = 5;
        for (let ring = 0; ring < rings; ring++) {
            const ringRadius = radius * (1 - ring / rings);
            const startRadius = ringRadius;
            const endRadius = radius * (1 - (ring + 1) / rings);

            for (let angle = 0; angle < 360; angle++) {
                for (let r = endRadius; r < startRadius; r++) {
                    const saturation = (r / radius) * 100;
                    const lightness = 50 + (ring * 10);

                    ctx.fillStyle = `hsl(${angle}, ${saturation}%, ${lightness}%)`;

                    const rad = (angle * Math.PI) / 180;
                    const x = centerX + r * Math.cos(rad);
                    const y = centerY + r * Math.sin(rad);

                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Add white center
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
        ctx.fill();
    }

    setupEventListeners() {
        // Dataset selection
        this.datasetSelect.addEventListener('change', (e) => {
            this.currentData = this.datasets[e.target.value];
        });

        // Touch and mouse events for selection
        this.colorWheel.addEventListener('mousedown', this.startSelection.bind(this));
        this.colorWheel.addEventListener('mousemove', this.continueSelection.bind(this));
        this.colorWheel.addEventListener('mouseup', this.endSelection.bind(this));
        this.colorWheel.addEventListener('mouseleave', this.endSelection.bind(this));

        this.colorWheel.addEventListener('touchstart', this.startSelection.bind(this));
        this.colorWheel.addEventListener('touchmove', this.continueSelection.bind(this));
        this.colorWheel.addEventListener('touchend', this.endSelection.bind(this));

        // Buttons
        this.clearSelectionBtn.addEventListener('click', this.clearSelection.bind(this));
        this.findColorsBtn.addEventListener('click', this.findMatchingColors.bind(this));
        this.selectAllBtn.addEventListener('click', this.selectAllCards.bind(this));
        this.deselectAllBtn.addEventListener('click', this.deselectAllCards.bind(this));
        this.exportCsvBtn.addEventListener('click', this.exportToCSV.bind(this));
    }

    getEventCoordinates(e) {
        const rect = this.colorWheel.getBoundingClientRect();
        const scaleX = this.colorWheel.width / rect.width;
        const scaleY = this.colorWheel.height / rect.height;

        if (e.touches && e.touches.length > 0) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }
    }

    startSelection(e) {
        e.preventDefault();
        this.isDrawing = true;
        this.selectionPath = [];
        const coords = this.getEventCoordinates(e);
        this.selectionPath.push(coords);
    }

    continueSelection(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        const coords = this.getEventCoordinates(e);
        this.selectionPath.push(coords);

        this.drawSelectionPath();
    }

    endSelection(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        this.isDrawing = false;

        if (this.selectionPath.length > 2) {
            this.captureSelectedColors();
        }
    }

    drawSelectionPath() {
        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.selectionOverlay.width, this.selectionOverlay.height);

        if (this.selectionPath.length < 2) return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(this.selectionPath[0].x, this.selectionPath[0].y);

        for (let i = 1; i < this.selectionPath.length; i++) {
            ctx.lineTo(this.selectionPath[i].x, this.selectionPath[i].y);
        }

        ctx.stroke();
    }

    captureSelectedColors() {
        if (this.selectionPath.length < 3) return;

        // Get colors within the selection path
        const ctx = this.wheelCtx;
        this.selectedColors.clear();

        // Find bounding box of selection
        const xs = this.selectionPath.map(p => p.x);
        const ys = this.selectionPath.map(p => p.y);
        const minX = Math.floor(Math.min(...xs));
        const maxX = Math.ceil(Math.max(...xs));
        const minY = Math.floor(Math.min(...ys));
        const maxY = Math.ceil(Math.max(...ys));

        // Sample colors within bounding box
        for (let y = minY; y <= maxY; y += 5) {
            for (let x = minX; x <= maxX; x += 5) {
                if (this.isPointInPath(x, y)) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    const color = this.rgbToHsl(pixel[0], pixel[1], pixel[2]);
                    this.selectedColors.add(JSON.stringify(color));
                }
            }
        }

        // Draw filled selection
        const overlayCtx = this.overlayCtx;
        overlayCtx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        overlayCtx.beginPath();
        overlayCtx.moveTo(this.selectionPath[0].x, this.selectionPath[0].y);
        for (let i = 1; i < this.selectionPath.length; i++) {
            overlayCtx.lineTo(this.selectionPath[i].x, this.selectionPath[i].y);
        }
        overlayCtx.closePath();
        overlayCtx.fill();

        console.log(`Captured ${this.selectedColors.size} unique colors`);
    }

    isPointInPath(x, y) {
        if (this.selectionPath.length < 3) return false;

        let inside = false;
        for (let i = 0, j = this.selectionPath.length - 1; i < this.selectionPath.length; j = i++) {
            const xi = this.selectionPath[i].x;
            const yi = this.selectionPath[i].y;
            const xj = this.selectionPath[j].x;
            const yj = this.selectionPath[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    clearSelection() {
        this.selectionPath = [];
        this.selectedColors.clear();
        this.overlayCtx.clearRect(0, 0, this.selectionOverlay.width, this.selectionOverlay.height);
        this.resultsSection.classList.add('hidden');
    }

    findMatchingColors() {
        if (this.selectedColors.size === 0) {
            alert('Please select an area on the color wheel first');
            return;
        }

        this.matchedVocabulary = [];

        // Convert selected colors to array
        const selectedHSL = Array.from(this.selectedColors).map(c => JSON.parse(c));

        // Match against vocabulary data
        this.currentData.forEach(item => {
            // Extract RGB or hex color from item
            let itemColor = null;

            if (item.hex) {
                itemColor = this.hexToRgb(item.hex);
            } else if (item.rgb) {
                itemColor = item.rgb;
            } else if (item.r !== undefined && item.g !== undefined && item.b !== undefined) {
                itemColor = { r: item.r, g: item.g, b: item.b };
            }

            if (itemColor) {
                const itemHSL = this.rgbToHsl(itemColor.r || itemColor[0],
                                              itemColor.g || itemColor[1],
                                              itemColor.b || itemColor[2]);

                // Check if item color matches any selected color
                const matches = selectedHSL.some(selectedColor => {
                    return this.colorDistance(selectedColor, itemHSL) < 30; // Threshold
                });

                if (matches) {
                    this.matchedVocabulary.push(item);
                }
            }
        });

        this.displayResults();
    }

    colorDistance(color1, color2) {
        // Calculate color distance in HSL space
        const hDiff = Math.min(Math.abs(color1.h - color2.h), 360 - Math.abs(color1.h - color2.h));
        const sDiff = Math.abs(color1.s - color2.s);
        const lDiff = Math.abs(color1.l - color2.l);

        return Math.sqrt(hDiff * hDiff + sDiff * sDiff + lDiff * lDiff);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    displayResults() {
        this.resultsSection.classList.remove('hidden');
        this.resultsCount.textContent = this.matchedVocabulary.length;
        this.vocabCards.innerHTML = '';

        this.matchedVocabulary.forEach((item, index) => {
            const card = this.createVocabCard(item, index);
            this.vocabCards.appendChild(card);
        });
    }

    createVocabCard(item, index) {
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.dataset.index = index;

        // Extract color information
        let hexColor = '';
        if (item.hex) {
            hexColor = item.hex;
        } else if (item.rgb) {
            hexColor = this.rgbToHex(item.rgb.r || item.rgb[0],
                                     item.rgb.g || item.rgb[1],
                                     item.rgb.b || item.rgb[2]);
        } else if (item.r !== undefined) {
            hexColor = this.rgbToHex(item.r, item.g, item.b);
        }

        card.innerHTML = `
            <div class="card-header">
                <input type="checkbox" class="card-checkbox" data-index="${index}">
                <div class="card-content">
                    <div class="color-name">${item.name || item.color_name || 'Unnamed'}</div>
                </div>
            </div>
            <div class="color-swatch" style="background-color: ${hexColor}"></div>
            <div class="color-details">
                ${item.hex ? `<div class="color-detail"><span class="detail-label">Hex:</span><span class="detail-value">${item.hex}</span></div>` : ''}
                ${item.rgb ? `<div class="color-detail"><span class="detail-label">RGB:</span><span class="detail-value">R:${item.rgb.r || item.rgb[0]} G:${item.rgb.g || item.rgb[1]} B:${item.rgb.b || item.rgb[2]}</span></div>` : ''}
                ${item.description ? `<div class="color-detail"><span class="detail-label">Description:</span><span class="detail-value">${item.description}</span></div>` : ''}
                ${item.category ? `<div class="color-detail"><span class="detail-label">Category:</span><span class="detail-value">${item.category}</span></div>` : ''}
            </div>
        `;

        // Checkbox event
        const checkbox = card.querySelector('.card-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        return card;
    }

    selectAllCards() {
        document.querySelectorAll('.card-checkbox').forEach(cb => {
            cb.checked = true;
            cb.closest('.vocab-card').classList.add('selected');
        });
    }

    deselectAllCards() {
        document.querySelectorAll('.card-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.vocab-card').classList.remove('selected');
        });
    }

    exportToCSV() {
        const selectedCards = Array.from(document.querySelectorAll('.card-checkbox:checked'));

        if (selectedCards.length === 0) {
            alert('Please select at least one vocabulary card to export');
            return;
        }

        // Anki CSV format: Front, Back, Tags
        const csvRows = [['Front', 'Back', 'Tags']];

        selectedCards.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            const item = this.matchedVocabulary[index];

            const colorName = item.name || item.color_name || 'Unnamed';

            let hexColor = '';
            if (item.hex) {
                hexColor = item.hex;
            } else if (item.rgb) {
                hexColor = this.rgbToHex(item.rgb.r || item.rgb[0],
                                         item.rgb.g || item.rgb[1],
                                         item.rgb.b || item.rgb[2]);
            } else if (item.r !== undefined) {
                hexColor = this.rgbToHex(item.r, item.g, item.b);
            }

            const front = colorName;
            const back = `<div style="width:200px;height:100px;background-color:${hexColor};border:1px solid #000;"></div><br>${item.description || ''}`;
            const tags = `color ${item.category || 'nature'}`;

            csvRows.push([
                this.escapeCSV(front),
                this.escapeCSV(back),
                this.escapeCSV(tags)
            ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `color-vocabulary-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeCSV(str) {
        if (typeof str !== 'string') str = String(str);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.log('Service Worker registration failed', err));
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ColorVocabularyApp();
    });
} else {
    new ColorVocabularyApp();
}
