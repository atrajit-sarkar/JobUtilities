class DocumentConverter {
    constructor() {
        this.files = [];
        this.convertedFiles = [];
        this.supportedFormats = {
            input: ['.doc', '.docx', '.pdf', '.txt', '.html', '.htm', '.md', '.rtf', '.jpg', '.jpeg', '.png'],
            output: ['pdf', 'docx', 'html', 'md', 'txt', 'rtf', 'jpg', 'png']
        };
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
        this.outputFormat = document.getElementById('outputFormat');
        this.preserveFormatting = document.getElementById('preserveFormatting');
        this.includeImages = document.getElementById('includeImages');
        this.compressionLevel = document.getElementById('compressionLevel');
        this.convertBtn = document.getElementById('convertBtn');
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
        this.convertBtn.addEventListener('click', () => this.convertDocuments());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            const isSupported = this.isFileSupported(file);
            const isValidSize = file.size <= 25 * 1024 * 1024; // 25MB limit
            return isSupported && isValidSize;
        });

        if (newFiles.length === 0) {
            alert('Please select valid document files (max 25MB each)\\nSupported: Word, PDF, TXT, HTML, Markdown, RTF');
            return;
        }

        this.files = [...this.files, ...newFiles];
        this.showControls();
        this.updateUploadArea();
    }

    isFileSupported(file) {
        const fileName = file.name.toLowerCase();
        const isExt = this.supportedFormats.input.some(ext => fileName.endsWith(ext));
        const isMime = /text|document|pdf|image\//i.test(file.type || '');
        return isExt || isMime;
    }

    updateUploadArea() {
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        if (this.files.length > 0) {
            const h3 = uploadContent.querySelector('h3');
            const p = uploadContent.querySelector('p');
            if (h3) h3.textContent = `${this.files.length} document${this.files.length > 1 ? 's' : ''} selected`;
            if (p) p.textContent = 'Click to add more documents or configure conversion settings below';
        }
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    async convertDocuments() {
        if (this.files.length === 0) {
            alert('Please select documents first');
            return;
        }

        this.showLoading(true);
        this.convertedFiles = [];

        try {
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const result = await this.convertDocument(file);
                this.convertedFiles.push(result);
            }

            this.displayResults();
            this.downloadAllBtn.style.display = 'inline-flex';
        } catch (error) {
            console.error('Conversion error:', error);
            alert('An error occurred during conversion. Please try again with different settings.');
        } finally {
            this.showLoading(false);
        }
    }

    async convertDocument(file) {
    const outputFormat = this.outputFormat.value;
        const preserveFormatting = this.preserveFormatting.checked;
        const includeImages = this.includeImages.checked;
        
        try {
            let convertedBlob;
            const fileExtension = this.getFileExtension(file.name);
            
            // Read file content
            const fileContent = await this.readFileContent(file, fileExtension);
            
            // Convert based on input and output formats
            switch (outputFormat) {
                case 'pdf':
                    // If input is image, create a PDF with image pages
                    if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
                        convertedBlob = await this.convertImageToPDF(fileContent, fileExtension, file.name);
                    } else {
                        convertedBlob = await this.convertToPDF(fileContent, fileExtension, file.name);
                    }
                    break;
                case 'html':
                    if (fileExtension === '.pdf') {
                        convertedBlob = await this.convertPDFToHTML(fileContent, file.name);
                    } else {
                        convertedBlob = await this.convertToHTML(fileContent, fileExtension);
                    }
                    break;
                case 'md':
                    convertedBlob = await this.convertToMarkdown(fileContent, fileExtension);
                    break;
                case 'txt':
                    convertedBlob = await this.convertToText(fileContent, fileExtension);
                    break;
                case 'docx':
                    convertedBlob = await this.convertToDocx(fileContent, fileExtension);
                    break;
                case 'rtf':
                    convertedBlob = await this.convertToRTF(fileContent, fileExtension);
                    break;
                case 'jpg':
                case 'png':
                    // If input is PDF, render pages to images; if input is HTML/MD/TXT/DOCX, rasterize
                    if (fileExtension === '.pdf') {
                        const imgResult = await this.convertPDFToImages(fileContent, outputFormat);
                        // If multiple pages, mark as zip in metadata
                        if (imgResult.isZip) {
                            return {
                                original: file,
                                converted: imgResult.blob,
                                outputFormat: 'zip',
                                status: 'success',
                                originalSize: file.size,
                                convertedSize: imgResult.blob.size,
                                meta: { kind: 'pdf-pages-images', pageCount: imgResult.pageCount, imageFormat: outputFormat }
                            };
                        }
                        convertedBlob = imgResult.blob;
                    } else if (['.html', '.htm', '.md', '.txt', '.docx'].includes(fileExtension)) {
                        // Render text/HTML to an image canvas and export
                        convertedBlob = await this.rasterizeDocumentToImage(fileContent, fileExtension, outputFormat);
                    } else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
                        // Already an image: if same format, just return original; else transcode
                        convertedBlob = await this.transcodeImage(fileContent, outputFormat);
                    } else {
                        throw new Error('Unsupported input for image output');
                    }
                    break;
                default:
                    throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            return {
                original: file,
                converted: convertedBlob,
                outputFormat: outputFormat,
                status: 'success',
                originalSize: file.size,
                convertedSize: convertedBlob.size
            };
            
        } catch (error) {
            console.error(`Error converting ${file.name}:`, error);
            return {
                original: file,
                converted: null,
                outputFormat: outputFormat,
                status: 'error',
                error: error.message,
                originalSize: file.size,
                convertedSize: 0
            };
        }
    }

    async readFileContent(file, extension) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            // Read as text for most formats, as array buffer for binary formats
            if (['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(extension)) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    getFileExtension(fileName) {
        return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    }

    async convertToPDF(content, inputFormat, originalName) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        let textContent = '';
        
        if (inputFormat === '.docx' && window.mammoth) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: content });
                textContent = result.value;
            } catch (error) {
                textContent = 'Error reading Word document: ' + error.message;
            }
        } else if (inputFormat === '.html' || inputFormat === '.htm') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            textContent = tempDiv.textContent || tempDiv.innerText;
        } else if (inputFormat === '.md') {
            // Simple markdown to text conversion
            textContent = content.replace(/[#*`_~]/g, '').replace(/\\[.*?\\]/g, '');
        } else {
            textContent = typeof content === 'string' ? content : 'Binary content detected';
        }
        
        // Add content to PDF with word wrapping
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(textContent, maxWidth);
        
        let y = 30;
        const lineHeight = 7;
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        lines.forEach(line => {
            if (y > pageHeight - 30) {
                pdf.addPage();
                y = 30;
            }
            pdf.text(line, margin, y);
            y += lineHeight;
        });
        
        return new Blob([pdf.output('blob')], { type: 'application/pdf' });
    }

    // New: Image (JPG/PNG) -> PDF
    async convertImageToPDF(arrayBuffer, inputFormat, originalName) {
        const { jsPDF } = window.jspdf;
        const img = await this.arrayBufferToImage(arrayBuffer);
        const orientation = img.width >= img.height ? 'l' : 'p';
        const pdf = new jsPDF({ orientation, unit: 'pt', format: [img.width, img.height] });
        const mime = inputFormat === '.png' ? 'image/png' : 'image/jpeg';
        const dataUrl = await this.imageToDataURL(img, mime);
        pdf.addImage(dataUrl, (mime === 'image/png') ? 'PNG' : 'JPEG', 0, 0, img.width, img.height, undefined, 'FAST');
        return pdf.output('blob');
    }

    // New: PDF -> JPG/PNG (first page or all pages zipped if multi-page)
    async convertPDFToImages(arrayBuffer, outFormat) {
        const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) throw new Error('PDF.js not available');
        if (pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js';
        }
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        // Render pages to images
        const images = [];
        for (let p = 1; p <= pageCount; p++) {
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const blob = await new Promise((res) => canvas.toBlob(res, outFormat === 'png' ? 'image/png' : 'image/jpeg', outFormat === 'png' ? 1.0 : 0.92));
            images.push({ index: p, blob });
        }
                if (images.length === 1) return { blob: images[0].blob, isZip: false, pageCount };
        // Zip if multiple pages
                if (typeof JSZip === 'undefined') throw new Error('Multi-page image output requires JSZip');
        const zip = new JSZip();
        const folder = zip.folder('pdf-pages');
        await Promise.all(images.map(async (img) => {
            const buf = await img.blob.arrayBuffer();
            folder.file(`page-${img.index}.${outFormat}`, buf);
        }));
                const blob = await zip.generateAsync({ type: 'blob' });
                return { blob, isZip: true, pageCount };
    }

        // New: PDF -> HTML (image-based pages for fidelity)
        async convertPDFToHTML(arrayBuffer, originalName) {
                const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
                if (!pdfjsLib) throw new Error('PDF.js not available');
                if (pdfjsLib.GlobalWorkerOptions) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js';
                }
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const pageImgs = [];
                for (let p = 1; p <= pdf.numPages; p++) {
                        const page = await pdf.getPage(p);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        await page.render({ canvasContext: ctx, viewport }).promise;
                        const dataUrl = canvas.toDataURL('image/png');
                        pageImgs.push({ index: p, dataUrl, width: viewport.width, height: viewport.height });
                }
                const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(originalName)} - Converted</title>
    <style>
        body { margin: 0; background: #f3f4f6; font-family: Arial, sans-serif; }
        .page { max-width: 1000px; margin: 20px auto; box-shadow: 0 6px 24px rgba(0,0,0,0.12); background: #fff; border-radius: 8px; overflow: hidden; }
        .page img { display: block; width: 100%; height: auto; }
    </style>
    </head>
<body>
    ${pageImgs.map(p => `<div class="page"><img src="${p.dataUrl}" alt="Page ${p.index}"/></div>`).join('\n')}
</body>
</html>`;
                return new Blob([html], { type: 'text/html' });
        }

    // New: Transcode image to desired format
    async transcodeImage(arrayBuffer, outFormat) {
        const img = await this.arrayBufferToImage(arrayBuffer);
        return await new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to transcode image')), outFormat === 'png' ? 'image/png' : 'image/jpeg', outFormat === 'png' ? 1.0 : 0.92);
        });
    }

    // New: Rasterize document-like content to an image (basic)
    async rasterizeDocumentToImage(content, inputFormat, outFormat) {
        const width = 1200, height = 1600;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#111827';
        ctx.font = '20px Inter, Arial, sans-serif';
        ctx.textBaseline = 'top';
        const text = await (async () => {
            if (inputFormat === '.docx' && window.mammoth) {
                try { const r = await mammoth.extractRawText({ arrayBuffer: content }); return r.value; } catch { return '[Error reading document]'; }
            }
            if (inputFormat === '.html' || inputFormat === '.htm') {
                const div = document.createElement('div'); div.innerHTML = content; return div.textContent || div.innerText || '';
            }
            if (inputFormat === '.md') { return (typeof content === 'string' ? content : '').replace(/[#*`_~]/g, ''); }
            return (typeof content === 'string' ? content : '[Binary content]');
        })();
        // Simple word wrap
        const margin = 60, lineHeight = 28, maxWidth = width - margin * 2;
        const words = text.split(/\s+/);
        let x = margin, y = margin, line = '';
        for (const w of words) {
            const test = line + w + ' ';
            const m = ctx.measureText(test);
            if (m.width > maxWidth) {
                ctx.fillText(line, x, y);
                y += lineHeight;
                if (y > height - margin) break;
                line = w + ' ';
            } else {
                line = test;
            }
        }
        if (y <= height - margin) ctx.fillText(line.trim(), x, y);
        return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), outFormat === 'png' ? 'image/png' : 'image/jpeg', outFormat === 'png' ? 1.0 : 0.92));
    }

    async arrayBufferToImage(arrayBuffer) {
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        try {
            const img = new Image();
            img.decoding = 'async';
            await new Promise((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
            return img;
        } finally {
            // Do not revoke immediately; image might still be used for toDataURL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    async imageToDataURL(img, mime) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL(mime);
    }

    async convertToHTML(content, inputFormat) {
        let htmlContent = '';
        
        if (inputFormat === '.docx' && window.mammoth) {
            try {
                const result = await mammoth.convertToHtml({ arrayBuffer: content });
                htmlContent = result.value;
            } catch (error) {
                htmlContent = `<p>Error converting Word document: ${error.message}</p>`;
            }
        } else if (inputFormat === '.md') {
            // Simple markdown to HTML conversion
            htmlContent = content
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                .replace(/\\n/g, '<br>');
        } else if (inputFormat === '.html' || inputFormat === '.htm') {
            htmlContent = content;
        } else {
            // Plain text to HTML
            const textContent = typeof content === 'string' ? content : 'Binary content detected';
            htmlContent = `<pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
        }
        
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
        
        return new Blob([fullHtml], { type: 'text/html' });
    }

    async convertToMarkdown(content, inputFormat) {
        let markdownContent = '';
        
        if (inputFormat === '.html' || inputFormat === '.htm') {
            if (window.TurndownService) {
                const turndownService = new TurndownService();
                markdownContent = turndownService.turndown(content);
            } else {
                // Fallback: basic HTML to markdown
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                markdownContent = tempDiv.textContent || tempDiv.innerText;
            }
        } else if (inputFormat === '.md') {
            markdownContent = content;
        } else if (inputFormat === '.docx' && window.mammoth) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: content });
                markdownContent = result.value;
            } catch (error) {
                markdownContent = `Error converting Word document: ${error.message}`;
            }
        } else {
            // Plain text to markdown
            const textContent = typeof content === 'string' ? content : 'Binary content detected';
            markdownContent = textContent;
        }
        
        return new Blob([markdownContent], { type: 'text/markdown' });
    }

    async convertToText(content, inputFormat) {
        let textContent = '';
        
        if (inputFormat === '.docx' && window.mammoth) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: content });
                textContent = result.value;
            } catch (error) {
                textContent = `Error converting Word document: ${error.message}`;
            }
        } else if (inputFormat === '.html' || inputFormat === '.htm') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            textContent = tempDiv.textContent || tempDiv.innerText;
        } else if (inputFormat === '.md') {
            // Simple markdown to text
            textContent = content.replace(/[#*`_~]/g, '').replace(/\\[.*?\\]/g, '');
        } else {
            textContent = typeof content === 'string' ? content : 'Binary content detected';
        }
        
        return new Blob([textContent], { type: 'text/plain' });
    }

    async convertToDocx(content, inputFormat) {
        // Note: Converting TO .docx requires more complex libraries
        // For now, we'll create a simple text document
        let textContent = '';
        
        if (inputFormat === '.html' || inputFormat === '.htm') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            textContent = tempDiv.textContent || tempDiv.innerText;
        } else if (inputFormat === '.md') {
            textContent = content.replace(/[#*`_~]/g, '').replace(/\\[.*?\\]/g, '');
        } else {
            textContent = typeof content === 'string' ? content : 'Binary content detected';
        }
        
        // Create a simple RTF that can be opened by Word
        const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 ${textContent.replace(/\\n/g, '\\\\par ')}}`;
        return new Blob([rtfContent], { type: 'application/rtf' });
    }

    async convertToRTF(content, inputFormat) {
        let textContent = '';
        
        if (inputFormat === '.docx' && window.mammoth) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: content });
                textContent = result.value;
            } catch (error) {
                textContent = `Error converting Word document: ${error.message}`;
            }
        } else if (inputFormat === '.html' || inputFormat === '.htm') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            textContent = tempDiv.textContent || tempDiv.innerText;
        } else if (inputFormat === '.md') {
            textContent = content.replace(/[#*`_~]/g, '').replace(/\\[.*?\\]/g, '');
        } else {
            textContent = typeof content === 'string' ? content : 'Binary content detected';
        }
        
        const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 ${textContent.replace(/\\n/g, '\\\\par ')}}`;
        return new Blob([rtfContent], { type: 'application/rtf' });
    }

    displayResults() {
        this.resultsSection.style.display = 'block';
        this.resultsGrid.innerHTML = '';

        this.convertedFiles.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            this.resultsGrid.appendChild(card);
        });
    }

    createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'result-card';

        const statusClass = result.status === 'success' ? 'status-success' : 'status-error';
        const statusIcon = result.status === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const statusText = result.status === 'success' ? 'Converted Successfully' : 'Conversion Failed';
        const formatIcon = (fmt => {
            if (fmt === 'pdf') return 'fa-file-pdf';
            if (fmt === 'docx' || fmt === 'rtf') return 'fa-file-word';
            if (fmt === 'html') return 'fa-code';
            if (fmt === 'md' || fmt === 'txt') return 'fa-file-alt';
            if (fmt === 'jpg' || fmt === 'png') return 'fa-image';
            return 'fa-file';
        })(result.outputFormat);

        card.innerHTML = `
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas ${formatIcon}"></i>
                </div>
                <div class="result-info">
                    <h4>${result.original.name}</h4>
                    <p>${this.formatFileSize(result.originalSize)} → ${result.status === 'success' ? this.formatFileSize(result.convertedSize) : 'Failed'}</p>
                    <span class="format-icon format-${result.outputFormat}">
                        <i class="fas fa-arrow-right"></i> ${result.outputFormat.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div class="conversion-status ${statusClass}">
                <i class="fas ${statusIcon}"></i>
                <span>${statusText}</span>
            </div>
            
            ${result.status === 'error' ? `<p style="color: #ef4444; font-size: 0.9rem;">${result.error}</p>` : ''}
            
            <button class="download-btn" onclick="documentConverter.downloadSingle(${index})" ${result.status === 'error' ? 'disabled' : ''}>
                <i class="fas fa-download"></i> Download ${result.outputFormat.toUpperCase()}
            </button>
        `;

        return card;
    }

    formatFileSize(bytes) {
        if (!bytes || bytes <= 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    downloadSingle(index) {
        const result = this.convertedFiles[index];
        if (result.status !== 'success' || !result.converted) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(result.converted);

        const originalName = result.original.name;
        const nameWithoutExt = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
        let extension = this.getExtensionForFormat(result.outputFormat);
        let filename = `${nameWithoutExt}-converted.${extension}`;
        if (result.outputFormat === 'zip' && result.meta && result.meta.kind === 'pdf-pages-images') {
            filename = `${nameWithoutExt}-pages-${result.meta.pageCount}-${result.meta.imageFormat}.zip`;
        }
        link.download = filename;
        link.click();
    }

    getExtensionForFormat(format) {
        const extensions = {
            'pdf': 'pdf',
            'docx': 'docx',
            'html': 'html',
            'md': 'md',
            'txt': 'txt',
            'rtf': 'rtf',
            'jpg': 'jpg',
            'png': 'png',
            'zip': 'zip'
        };
        return extensions[format] || format;
    }

    downloadAll() {
        const successfulConversions = this.convertedFiles.filter(result => result.status === 'success');
        
        if (successfulConversions.length === 0) {
            alert('No successfully converted files to download');
            return;
        }

        if (typeof JSZip === 'undefined') {
            // Fallback: sequential downloads
            successfulConversions.forEach((result, index) => {
                const actualIndex = this.convertedFiles.indexOf(result);
                setTimeout(() => this.downloadSingle(actualIndex), index * 500);
            });
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('converted-documents');
        
        const addFilePromises = successfulConversions.map((result) => {
            const originalName = result.original.name;
            const nameWithoutExt = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
            let extension = this.getExtensionForFormat(result.outputFormat);
            let base = `${nameWithoutExt}-converted`;
            if (result.outputFormat === 'zip' && result.meta && result.meta.kind === 'pdf-pages-images') {
                base = `${nameWithoutExt}-pages-${result.meta.pageCount}-${result.meta.imageFormat}`;
            }
            const safeName = this.sanitizeFileName(`${base}.${extension}`);
            
            return result.converted.arrayBuffer().then((buf) => {
                folder.file(safeName, buf);
            });
        });

        Promise.all(addFilePromises)
            .then(() => zip.generateAsync({ type: 'blob' }))
            .then((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'converted-documents.zip';
                a.click();
            });
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Z0-9\\-_. ]/g, '_');
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    clearAll() {
        this.files = [];
        this.convertedFiles = [];
        this.fileInput.value = '';
        this.controlsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.downloadAllBtn.style.display = 'none';

        // Reset upload area
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        const icon = uploadContent.querySelector('i');
        const h3 = uploadContent.querySelector('h3');
        const p = uploadContent.querySelector('p');
        
        if (icon) icon.className = 'fas fa-file-alt';
        if (h3) h3.textContent = 'Drop your documents here or click to browse';
        if (p) p.textContent = 'Supports Word, PDF, TXT, HTML, Markdown • Max 25MB per file';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the document converter
const documentConverter = new DocumentConverter();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        documentConverter.clearAll();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        documentConverter.convertDocuments();
    }
});

// Prevent default drag behaviors
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
