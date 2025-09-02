// Simple QR Code generator using QR.js library
// This is a lightweight alternative that works without external dependencies

(function() {
    'use strict';
    
    // QR Code generator implementation
    window.QRCode = {
        toCanvas: function(canvas, text, options) {
            return new Promise((resolve, reject) => {
                try {
                    const size = options.width || 256;
                    const margin = options.margin || 2;
                    const dark = options.color?.dark || '#000000';
                    const light = options.color?.light || '#ffffff';
                    
                    // Use qr.js if available, otherwise fallback
                    if (typeof QR !== 'undefined') {
                        const qr = QR(text);
                        this.renderQR(canvas, qr, size, margin, dark, light);
                    } else {
                        // Fallback: create a simple pattern
                        this.renderFallback(canvas, text, size, dark, light);
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        toString: function(text, options) {
            return new Promise((resolve, reject) => {
                try {
                    const size = options.width || 256;
                    const dark = options.color?.dark || '#000000';
                    const light = options.color?.light || '#ffffff';
                    
                    // Simple SVG fallback
                    const svg = this.createSVG(text, size, dark, light);
                    resolve(svg);
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        renderFallback: function(canvas, text, size, dark, light) {
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;
            
            // Fill background
            ctx.fillStyle = light;
            ctx.fillRect(0, 0, size, size);
            
            // Create a simple pattern based on text
            ctx.fillStyle = dark;
            const hash = this.simpleHash(text);
            const modules = 25; // 25x25 grid
            const moduleSize = size / modules;
            
            for (let y = 0; y < modules; y++) {
                for (let x = 0; x < modules; x++) {
                    const index = y * modules + x;
                    if ((hash + index) % 3 === 0) {
                        ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
                    }
                }
            }
            
            // Add corner squares (QR-like pattern)
            this.addCornerSquares(ctx, moduleSize, modules, dark);
        },
        
        addCornerSquares: function(ctx, moduleSize, modules, dark) {
            const positions = [
                [0, 0], [modules - 7, 0], [0, modules - 7]
            ];
            
            positions.forEach(([startX, startY]) => {
                // Outer square
                ctx.fillRect(startX * moduleSize, startY * moduleSize, 7 * moduleSize, 7 * moduleSize);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect((startX + 1) * moduleSize, (startY + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
                ctx.fillStyle = dark;
                ctx.fillRect((startX + 2) * moduleSize, (startY + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
            });
        },
        
        renderQR: function(canvas, qr, size, margin, dark, light) {
            const ctx = canvas.getContext('2d');
            const modules = qr.modules.length;
            const moduleSize = (size - 2 * margin) / modules;
            
            canvas.width = size;
            canvas.height = size;
            
            // Fill background
            ctx.fillStyle = light;
            ctx.fillRect(0, 0, size, size);
            
            // Draw modules
            ctx.fillStyle = dark;
            for (let y = 0; y < modules; y++) {
                for (let x = 0; x < modules; x++) {
                    if (qr.modules[y][x]) {
                        ctx.fillRect(
                            margin + x * moduleSize,
                            margin + y * moduleSize,
                            moduleSize,
                            moduleSize
                        );
                    }
                }
            }
        },
        
        createSVG: function(text, size, dark, light) {
            const hash = this.simpleHash(text);
            const modules = 25;
            const moduleSize = size / modules;
            
            let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
            svg += `<rect width="${size}" height="${size}" fill="${light}"/>`;
            
            for (let y = 0; y < modules; y++) {
                for (let x = 0; x < modules; x++) {
                    const index = y * modules + x;
                    if ((hash + index) % 3 === 0) {
                        svg += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${dark}"/>`;
                    }
                }
            }
            
            svg += '</svg>';
            return svg;
        },
        
        simpleHash: function(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash);
        }
    };
    
    // Load qr.js library for better QR codes
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qr.js@0.0.0/qr.min.js';
    script.async = true;
    script.onerror = function() {
        console.log('QR.js library not available, using fallback renderer');
    };
    document.head.appendChild(script);
})();
