class PDFCompressor {
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
    this.sizeControl = document.getElementById('sizeControl');
    this.targetSize = document.getElementById('targetSize');
        this.compressionLevel = document.getElementById('compressionLevel');
        this.imageQuality = document.getElementById('imageQuality');
        this.imageQualityValue = document.getElementById('imageQualityValue');
        this.dpi = document.getElementById('dpi');
        this.removeMetadata = document.getElementById('removeMetadata');
        this.optimizeFonts = document.getElementById('optimizeFonts');
        this.compressImages = document.getElementById('compressImages');
        this.compressBtn = document.getElementById('compressBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('input[type="file"]')) return;
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
        this.imageQuality.addEventListener('input', () => this.updateImageQualityDisplay());
        this.compressBtn.addEventListener('click', () => this.compressPDFs());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
            return isPDF && isValidSize;
        });

        if (newFiles.length === 0) {
            alert('Please select valid PDF files (max 50MB each)');
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
            if (h3) h3.textContent = `${this.files.length} PDF${this.files.length > 1 ? 's' : ''} selected`;
            if (p) p.textContent = 'Click to add more PDFs or configure compression settings below';
        }
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    updateImageQualityDisplay() {
        this.imageQualityValue.textContent = this.imageQuality.value;
        // Update CSS variable for range styling
        this.imageQuality.style.setProperty('--value', this.imageQuality.value + '%');
    }

    toggleCompressionMode() {
        const isQualityMode = this.compressionMode.value === 'quality';
        this.sizeControl.style.display = isQualityMode ? 'none' : 'block';
    }

    async compressPDFs() {
        if (this.files.length === 0) {
            alert('Please select PDF files first');
            return;
        }
        if (this.compressionMode.value === 'size') {
            const kb = parseInt(this.targetSize.value, 10);
            if (!kb || kb < 20) {
                alert('Please enter a valid Target Size (at least 20 KB).');
                return;
            }
        }

        this.showLoading(true);
        this.compressedFiles = [];

        try {
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const compressedFile = await this.compressPDF(file);
                const originalSize = file.size;
                const compressedSize = compressedFile.size;
                const savingsPct = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
                this.compressedFiles.push({
                    original: file,
                    compressed: compressedFile,
                    originalSize,
                    compressedSize,
                    savings: savingsPct
                });
            }

            this.displayResults();
            this.downloadAllBtn.style.display = 'inline-flex';
        } catch (error) {
            console.error('PDF compression error:', error);
            alert('An error occurred during PDF compression. Please try again with different settings.');
        } finally {
            this.showLoading(false);
        }
    }

    async compressPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // Get compression settings
            const level = this.compressionLevel.value;
            const quality = parseInt(this.imageQuality.value);
            const targetDPI = parseInt(this.dpi.value);
            const removeMetadata = this.removeMetadata.checked;
            const optimizeFonts = this.optimizeFonts.checked;
            const compressImages = this.compressImages.checked;

            // Apply compression based on level
            let compressionOptions = this.getCompressionOptions(level, quality, targetDPI);

            // Remove metadata if requested
            if (removeMetadata) {
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer('');
                pdfDoc.setCreator('');
            }

            if (this.compressionMode.value === 'size') {
                // Target size mode: rasterize pages and binary search JPEG quality/DPI
                const targetBytes = Math.max(50, parseInt(this.targetSize.value || '0')) * 1024;
                const blob = await this.compressPDFToTargetSize(arrayBuffer, targetBytes);
                return blob || file;
            } else {
                // Quality/DPI-based save
                const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
                return new Blob([pdfBytes], { type: 'application/pdf' });
            }
        } catch (error) {
            console.error('Error compressing PDF:', error);
            // Return original file if compression fails
            return file;
        }
    }

    async compressPDFToTargetSize(arrayBuffer, targetBytes) {
        // Render each page to canvas via pdf.js, then rebuild a PDF with JPEGs.
        try {
            const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
            if (!pdfjsLib) return null;
            if (pdfjsLib.GlobalWorkerOptions) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js';
            }

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            // Binary search quality with progressive downscaling until <= target
            let bestUnder = null; // best blob under target
            let smallestSeen = null; // smallest blob overall
            let scale = 1.0;
            const maxAttempts = 6;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                let lowQ = 0.1, highQ = 0.95; // broaden range
                for (let i = 0; i < 9; i++) {
                    const q = (lowQ + highQ) / 2;
                    const blob = await this.buildPdfFromRaster(pdf, q, scale);
                    if (!blob) return null;
                    const size = blob.size;
                    if (!smallestSeen || size < smallestSeen.size) smallestSeen = blob;
                    if (size > targetBytes) {
                        highQ = q; // need smaller
                    } else {
                        lowQ = q;
                        if (!bestUnder || size > bestUnder.size) bestUnder = blob;
                    }
                    if (Math.abs(highQ - lowQ) < 0.015) break;
                }
                if (bestUnder && bestUnder.size <= targetBytes) return bestUnder;
                // Reduce scale and try again, until very small
                scale *= 0.8;
                if (scale < 0.2) break;
            }
            // If we couldn't get under, return the smallest we achieved
            return bestUnder || smallestSeen;
        } catch (e) {
            console.error('Target-size PDF compression failed:', e);
            return null;
        }
    }

    async buildPdfFromRaster(pdf, quality, scale) {
        const pdfDoc = await PDFLib.PDFDocument.create();
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpgBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
            const jpg = await pdfDoc.embedJpg(jpgBytes);
            const p = pdfDoc.addPage([canvas.width, canvas.height]);
            p.drawImage(jpg, { x: 0, y: 0, width: canvas.width, height: canvas.height });
        }
        const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        return new Blob([bytes], { type: 'application/pdf' });
    }

    getCompressionOptions(level, quality, targetDPI) {
        const options = {
            imageQuality: quality,
            targetDPI: targetDPI,
        };

        switch (level) {
            case 'low':
                options.compressionRatio = 0.9;
                break;
            case 'medium':
                options.compressionRatio = 0.7;
                break;
            case 'high':
                options.compressionRatio = 0.5;
                break;
            case 'extreme':
                options.compressionRatio = 0.3;
                break;
            default:
                options.compressionRatio = 0.7;
        }

        return options;
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

        card.innerHTML = `
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
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
            
            <button class="download-btn" onclick="pdfCompressor.downloadSingle(${index})">
                <i class="fas fa-download"></i> Download Compressed PDF
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
        const nameWithoutExt = originalName.replace('.pdf', '');
        
        link.download = `${nameWithoutExt}-compressed.pdf`;
        link.click();
    }

    downloadAll() {
        if (this.compressedFiles.length === 0) return;

        if (typeof JSZip === 'undefined') {
            // Fallback to sequential downloads
            this.compressedFiles.forEach((_, index) => {
                setTimeout(() => this.downloadSingle(index), index * 500);
            });
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('compressed-pdfs');
        const addFilePromises = this.compressedFiles.map((result) => {
            const originalName = result.original.name;
            const nameWithoutExt = originalName.toLowerCase().endsWith('.pdf')
                ? originalName.slice(0, -4)
                : originalName;
            const safeName = this.sanitizeFileName(`${nameWithoutExt}-compressed.pdf`);
            return result.compressed.arrayBuffer().then((buf) => {
                folder.file(safeName, buf);
            });
        });

        Promise.all(addFilePromises)
            .then(() => zip.generateAsync({ type: 'blob' }))
            .then((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'compressed-pdfs.zip';
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
    if (icon) icon.className = 'fas fa-file-pdf';
    if (h3) h3.textContent = 'Drop your PDF files here or click to browse';
    if (p) p.textContent = 'Supports PDF files • Max 50MB per file';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the PDF compressor
const pdfCompressor = new PDFCompressor();

// Initialize quality display on page load
document.addEventListener('DOMContentLoaded', () => {
    pdfCompressor.updateImageQualityDisplay();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to clear all
    if (e.key === 'Escape') {
        pdfCompressor.clearAll();
    }
    
    // Ctrl/Cmd + Enter to compress
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        pdfCompressor.compressPDFs();
    }
});

// Prevent default drag behaviors
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
