class ImageCompressor {
    constructor() {
        this.files = [];
        this.compressedFiles = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
    this.browseBtn = this.uploadArea.querySelector('.browse-btn');
        this.controlsSection = document.getElementById('controlsSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.compressionMode = document.getElementById('compressionMode');
        this.qualityControl = document.getElementById('qualityControl');
        this.sizeControl = document.getElementById('sizeControl');
        this.quality = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        this.targetSize = document.getElementById('targetSize');
        this.format = document.getElementById('format');
        this.preserveMetadata = document.getElementById('preserveMetadata');
        this.compressBtn = document.getElementById('compressBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', (e) => {
            // Avoid double triggering when clicking the button or input
            if (e.target.closest('button') || e.target.closest('input[type="file"]')) return;
            // Clear value to ensure selecting same file triggers 'change'
            this.fileInput.value = '';
            this.fileInput.click();
        });
        this.fileInput.addEventListener('click', (e) => e.stopPropagation());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        if (this.browseBtn) {
            this.browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.fileInput.value = '';
                this.fileInput.click();
            });
        }
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Control events
        this.compressionMode.addEventListener('change', () => this.toggleCompressionMode());
        this.quality.addEventListener('input', () => this.updateQualityDisplay());
        this.compressBtn.addEventListener('click', () => this.compressImages());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            const isImage = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            return isImage && isValidSize;
        });

        if (newFiles.length === 0) {
            alert('Please select valid image files (max 10MB each)');
            return;
        }

        this.files = [...this.files, ...newFiles];
        this.showControls();
        this.updateUploadArea();
    }

    updateUploadArea() {
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        if (this.files.length > 0) {
            const h3 = uploadContent.querySelector('h3');
            const p = uploadContent.querySelector('p');
            if (h3) h3.textContent = `${this.files.length} image${this.files.length > 1 ? 's' : ''} selected`;
            if (p) p.textContent = 'Click to add more images or configure compression settings below';
        }
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    toggleCompressionMode() {
        const isQualityMode = this.compressionMode.value === 'quality';
        this.qualityControl.style.display = isQualityMode ? 'block' : 'none';
        this.sizeControl.style.display = isQualityMode ? 'none' : 'block';
    }

    updateQualityDisplay() {
        this.qualityValue.textContent = this.quality.value;
        // Update CSS variable for range styling
        this.quality.style.setProperty('--value', this.quality.value + '%');
    }

    async compressImages() {
        if (this.files.length === 0) {
            alert('Please select images first');
            return;
        }

        this.showLoading(true);
        this.compressedFiles = [];

        try {
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const compressedFile = await this.compressImage(file);
                this.compressedFiles.push({
                    original: file,
                    compressed: compressedFile,
                    originalSize: file.size,
                    compressedSize: compressedFile.size,
                    savings: ((file.size - compressedFile.size) / file.size * 100).toFixed(1)
                });
            }

            this.displayResults();
            this.downloadAllBtn.style.display = 'inline-flex';
        } catch (error) {
            console.error('Compression error:', error);
            alert('An error occurred during compression. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Keep original dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0);

                // Determine output format
                let outputFormat = this.format.value;
                if (outputFormat === 'auto') {
                    outputFormat = file.type;
                } else {
                    outputFormat = `image/${outputFormat}`;
                }

                // Compress based on mode
                if (this.compressionMode.value === 'quality') {
                    const quality = this.quality.value / 100;
                    canvas.toBlob(resolve, outputFormat, quality);
                } else {
                    // Target size mode - binary search for quality
                    this.findQualityForTargetSize(canvas, outputFormat, parseInt(this.targetSize.value) * 1024, resolve);
                }
            };

            img.src = URL.createObjectURL(file);
        });
    }

    findQualityForTargetSize(canvas, format, targetSize, callback) {
        let low = 0.05, high = 1.0;
        let bestUnder = null; // best blob <= target
        let smallest = null;  // smallest blob seen (may be > target if impossible)
        let iterations = 0;
        const maxIterations = 9;

        const tryQuality = (quality) => {
            canvas.toBlob((blob) => {
                iterations++;

                if (!smallest || blob.size < smallest.size) smallest = blob;

                if (blob.size > targetSize) {
                    high = quality;
                } else {
                    low = quality;
                    if (!bestUnder || blob.size > bestUnder.size) bestUnder = blob;
                }

                const nextQuality = (low + high) / 2;
                if (iterations >= maxIterations || (high - low) < 0.02) {
                    callback(bestUnder || smallest);
                } else {
                    tryQuality(nextQuality);
                }
            }, format, quality);
        };

        tryQuality(0.8);
    }

    displayResults() {
        this.resultsSection.style.display = 'block';
        this.resultsGrid.innerHTML = '';

        this.compressedFiles.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            this.resultsGrid.appendChild(card);
        });
    }

    createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'result-card';

        const originalPreview = URL.createObjectURL(result.original);
        const compressedPreview = URL.createObjectURL(result.compressed);

        card.innerHTML = `
            <div class="result-header">
                <img src="${compressedPreview}" alt="Compressed preview" class="result-preview">
                <div class="result-info">
                    <h4>${result.original.name}</h4>
                    <p>${this.formatFileSize(result.originalSize)} → ${this.formatFileSize(result.compressedSize)}</p>
                </div>
            </div>
            
            <div class="result-stats">
                <div class="stat-item">
                    <div class="stat-value">${result.savings}%</div>
                    <div class="stat-label">Saved</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.formatFileSize(result.originalSize - result.compressedSize)}</div>
                    <div class="stat-label">Reduced</div>
                </div>
            </div>
            
            <div class="compression-bar">
                <div class="compression-fill" style="width: ${result.savings}%"></div>
            </div>
            
            <button class="download-btn" onclick="compressor.downloadSingle(${index})">
                <i class="fas fa-download"></i> Download Compressed
            </button>
        `;

        return card;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    downloadSingle(index) {
        const result = this.compressedFiles[index];
        const link = document.createElement('a');
        link.href = URL.createObjectURL(result.compressed);
        
        // Generate filename with compression suffix
        const originalName = result.original.name;
        const lastDot = originalName.lastIndexOf('.');
        const nameWithoutExt = originalName.substring(0, lastDot);
        const ext = originalName.substring(lastDot);
        
        link.download = `${nameWithoutExt}-compressed${ext}`;
        link.click();
    }

    downloadAll() {
        if (this.compressedFiles.length === 0) return;

        if (typeof JSZip === 'undefined') {
            // Fallback: sequential downloads
            this.compressedFiles.forEach((_, index) => {
                setTimeout(() => this.downloadSingle(index), index * 500);
            });
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('compressed-images');
        const addFilePromises = this.compressedFiles.map((result) => {
            const originalName = result.original.name;
            const lastDot = originalName.lastIndexOf('.');
            const nameWithoutExt = lastDot > -1 ? originalName.substring(0, lastDot) : originalName;
            const ext = lastDot > -1 ? originalName.substring(lastDot) : '';
            const safeName = this.sanitizeFileName(`${nameWithoutExt}-compressed${ext}`);
            return result.compressed.arrayBuffer().then((buf) => {
                folder.file(safeName, buf);
            });
        });

        Promise.all(addFilePromises)
            .then(() => zip.generateAsync({ type: 'blob' }))
            .then((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'compressed-images.zip';
                a.click();
            });
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Z0-9\-_. ]/g, '_');
    }

    clearAll() {
        this.files = [];
        this.compressedFiles = [];
        this.fileInput.value = '';
        this.controlsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.downloadAllBtn.style.display = 'none';

    // Reset upload area texts without replacing input/button
    const uploadContent = this.uploadArea.querySelector('.upload-content');
    const icon = uploadContent.querySelector('i');
    const h3 = uploadContent.querySelector('h3');
    const p = uploadContent.querySelector('p');
    if (icon) icon.className = 'fas fa-cloud-upload-alt';
    if (h3) h3.textContent = 'Drop your images here or click to browse';
    if (p) p.textContent = 'Supports JPEG, PNG, WebP • Max 10MB per file';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the application
const compressor = new ImageCompressor();

// Initialize quality display on page load
document.addEventListener('DOMContentLoaded', () => {
    compressor.updateQualityDisplay();
});

// Add some utility functions for enhanced UX
document.addEventListener('keydown', (e) => {
    // Escape key to clear all
    if (e.key === 'Escape') {
        compressor.clearAll();
    }
    
    // Ctrl/Cmd + Enter to compress
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        compressor.compressImages();
    }
});

// Prevent default drag behaviors on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
