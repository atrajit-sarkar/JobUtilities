class DocumentConverter {
    constructor() {
        this.files = [];
        this.convertedFiles = [];
        this.supportedFormats = {
            input: ['.doc', '.docx', '.pdf', '.txt', '.html', '.htm', '.md', '.rtf'],
            output: ['pdf', 'docx', 'html', 'md', 'txt', 'rtf']
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
        return this.supportedFormats.input.some(ext => fileName.endsWith(ext)) ||
               file.type.includes('text') || 
               file.type.includes('document') ||
               file.type.includes('pdf');
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
                    convertedBlob = await this.convertToPDF(fileContent, fileExtension, file.name);
                    break;
                case 'html':
                    convertedBlob = await this.convertToHTML(fileContent, fileExtension);
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
            if (['.pdf', '.doc', '.docx'].includes(extension)) {
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

        card.innerHTML = `
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-file-alt"></i>
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
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const extension = this.getExtensionForFormat(result.outputFormat);
        
        link.download = `${nameWithoutExt}-converted.${extension}`;
        link.click();
    }

    getExtensionForFormat(format) {
        const extensions = {
            'pdf': 'pdf',
            'docx': 'docx',
            'html': 'html',
            'md': 'md',
            'txt': 'txt',
            'rtf': 'rtf'
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
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
            const extension = this.getExtensionForFormat(result.outputFormat);
            const safeName = this.sanitizeFileName(`${nameWithoutExt}-converted.${extension}`);
            
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
