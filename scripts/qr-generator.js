class QRGenerator {
    constructor() {
        this.currentType = 'text';
        this.logoImage = null;
        this.initializeElements();
        this.bindEvents();
        this.updateSliderValues();
    }

    initializeElements() {
        // Type buttons
        this.typeButtons = document.querySelectorAll('.type-btn');
        this.inputForms = document.querySelectorAll('.input-form');
        
        // Form elements
        this.textContent = document.getElementById('textContent');
        this.urlContent = document.getElementById('urlContent');
        this.wifiSSID = document.getElementById('wifiSSID');
        this.wifiPassword = document.getElementById('wifiPassword');
        this.wifiSecurity = document.getElementById('wifiSecurity');
        this.wifiHidden = document.getElementById('wifiHidden');
        this.contactName = document.getElementById('contactName');
        this.contactPhone = document.getElementById('contactPhone');
        this.contactEmail = document.getElementById('contactEmail');
        this.contactOrg = document.getElementById('contactOrg');
        this.contactAddress = document.getElementById('contactAddress');
        this.emailTo = document.getElementById('emailTo');
        this.emailSubject = document.getElementById('emailSubject');
        this.emailBody = document.getElementById('emailBody');
        this.phoneNumber = document.getElementById('phoneNumber');
        this.smsNumber = document.getElementById('smsNumber');
        this.smsMessage = document.getElementById('smsMessage');
        
        // Customization elements
        this.qrSize = document.getElementById('qrSize');
        this.sizeValue = document.getElementById('sizeValue');
        this.foregroundColor = document.getElementById('foregroundColor');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.errorCorrection = document.getElementById('errorCorrection');
        this.logoUpload = document.getElementById('logoUpload');
        this.logoSize = document.getElementById('logoSize');
        this.logoSizeValue = document.getElementById('logoSizeValue');
        
        // Action elements
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.qrPreview = document.getElementById('qrPreview');
        this.downloadOptions = document.getElementById('downloadOptions');
        this.downloadPNG = document.getElementById('downloadPNG');
        this.downloadSVG = document.getElementById('downloadSVG');
        this.downloadJPG = document.getElementById('downloadJPG');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Type selection
        this.typeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectType(btn.dataset.type));
        });

    // Form inputs: no auto-generate; user will click Generate

        // Customization controls
    this.qrSize.addEventListener('input', () => this.updateSliderValues());
    this.logoSize.addEventListener('input', () => this.updateSliderValues());
    // No auto-generate on customization changes
    this.foregroundColor.addEventListener('change', () => {});
    this.backgroundColor.addEventListener('change', () => {});
    this.errorCorrection.addEventListener('change', () => {});
        
        // Logo upload
    this.logoUpload.addEventListener('change', (e) => this.handleLogoUpload(e));
        
        // Action buttons
        this.generateBtn.addEventListener('click', () => this.generateQR());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        
        // Download buttons
        this.downloadPNG.addEventListener('click', () => this.downloadQR('png'));
        this.downloadSVG.addEventListener('click', () => this.downloadQR('svg'));
        this.downloadJPG.addEventListener('click', () => this.downloadQR('jpg'));
    }

    selectType(type) {
        this.currentType = type;
        
        // Update active button
        this.typeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Show corresponding form
        this.inputForms.forEach(form => {
            form.classList.toggle('active', form.id === `${type}-form`);
        });
        
        // Clear preview if switching types
        this.clearPreview();
    }

    updateSliderValues() {
        this.sizeValue.textContent = this.qrSize.value + 'px';
        this.qrSize.style.setProperty('--value', (this.qrSize.value - 128) / (512 - 128) * 100 + '%');
        
        this.logoSizeValue.textContent = this.logoSize.value + '%';
        this.logoSize.style.setProperty('--value', (this.logoSize.value - 10) / (30 - 10) * 100 + '%');
        
    // Do not auto-generate
    }

    debounceGenerate() {
        clearTimeout(this.generateTimeout);
        this.generateTimeout = setTimeout(() => {
            if (this.hasContent()) {
                this.generateQR();
            }
        }, 500);
    }

    hasContent() {
        switch (this.currentType) {
            case 'text': return this.textContent.value.trim();
            case 'url': return this.urlContent.value.trim();
            case 'wifi': return this.wifiSSID.value.trim();
            case 'contact': return this.contactName.value.trim() || this.contactPhone.value.trim();
            case 'email': return this.emailTo.value.trim();
            case 'phone': return this.phoneNumber.value.trim();
            case 'sms': return this.smsNumber.value.trim();
            default: return false;
        }
    }

    getQRContent() {
        switch (this.currentType) {
            case 'text':
                return this.textContent.value.trim();
            
            case 'url':
                let url = this.urlContent.value.trim();
                if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                return url;
            
            case 'wifi':
                const ssid = this.wifiSSID.value.trim();
                const password = this.wifiPassword.value;
                const security = this.wifiSecurity.value;
                const hidden = this.wifiHidden.checked;
                
                if (!ssid) return '';
                
                return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
            
            case 'contact':
                const name = this.contactName.value.trim();
                const phone = this.contactPhone.value.trim();
                const email = this.contactEmail.value.trim();
                const org = this.contactOrg.value.trim();
                const address = this.contactAddress.value.trim();
                
                if (!name && !phone) return '';
                
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (name) vcard += `FN:${name}\n`;
                if (phone) vcard += `TEL:${phone}\n`;
                if (email) vcard += `EMAIL:${email}\n`;
                if (org) vcard += `ORG:${org}\n`;
                if (address) vcard += `ADR:;;${address};;;;\n`;
                vcard += 'END:VCARD';
                
                return vcard;
            
            case 'email':
                const to = this.emailTo.value.trim();
                const subject = this.emailSubject.value.trim();
                const body = this.emailBody.value.trim();
                
                if (!to) return '';
                
                let mailto = `mailto:${to}`;
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                if (params.length) mailto += '?' + params.join('&');
                
                return mailto;
            
            case 'phone':
                const number = this.phoneNumber.value.trim();
                return number ? `tel:${number}` : '';
            
            case 'sms':
                const smsNum = this.smsNumber.value.trim();
                const message = this.smsMessage.value.trim();
                
                if (!smsNum) return '';
                
                return `sms:${smsNum}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
            
            default:
                return '';
        }
    }

    async handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.logoImage = null;
            this.logoSize.disabled = true;
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        try {
            this.logoImage = await this.loadImage(file);
            this.logoSize.disabled = false;
            // Do not auto-generate
        } catch (error) {
            console.error('Error loading logo:', error);
            alert('Error loading logo image');
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async generateQR() {
        const content = this.getQRContent();
        if (!content) {
            this.clearPreview();
            return;
        }

        this.showLoading(true);

        try {
            // Ensure QRCode library is available
            const ok = await this.ensureQRCodeLoaded();
            if (!ok || typeof window.QRCode === 'undefined') {
                alert('QR library failed to load. Please check your internet connection and refresh the page.');
                return;
            }

            const size = parseInt(this.qrSize.value);
            const options = {
                width: size,
                height: size,
                color: {
                    dark: this.foregroundColor.value,
                    light: this.backgroundColor.value
                },
                errorCorrectionLevel: this.errorCorrection.value,
                margin: 2
            };

            // Generate QR code
            const canvas = document.createElement('canvas');
            await window.QRCode.toCanvas(canvas, content, options);

            // Add logo if provided
            if (this.logoImage) {
                await this.addLogoToCanvas(canvas);
            }

            // Update preview
            this.updatePreview(canvas);
            this.showDownloadOptions();

        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Error generating QR code. Please check your input and network connection.');
        } finally {
            this.showLoading(false);
        }
    }

    async addLogoToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const logoSizePercent = parseInt(this.logoSize.value) / 100;
        const logoSize = Math.min(canvas.width, canvas.height) * logoSizePercent;
        
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        
        // Create a circular clip for the logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2, 0, 2 * Math.PI);
        ctx.clip();
        
        // Draw logo
        ctx.drawImage(this.logoImage, x, y, logoSize, logoSize);
        ctx.restore();
        
        // Add white border around logo for better contrast
        ctx.save();
        ctx.strokeStyle = this.backgroundColor.value;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2 + 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
    }

    updatePreview(canvas) {
        this.qrPreview.innerHTML = '';
        this.qrPreview.appendChild(canvas);
        this.qrPreview.classList.add('has-qr');
        this.currentCanvas = canvas;
    }

    showDownloadOptions() {
        this.downloadOptions.style.display = 'flex';
    }

    clearPreview() {
        this.qrPreview.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-qrcode"></i>
                <p>Your QR code will appear here</p>
            </div>
        `;
        this.qrPreview.classList.remove('has-qr');
        this.downloadOptions.style.display = 'none';
        this.currentCanvas = null;
    }

    async downloadQR(format) {
        if (!this.currentCanvas) return;

        const content = this.getQRContent();
        const filename = this.generateFilename(format);

        try {
            let blob;
            
            switch (format) {
                case 'png':
                    blob = await this.canvasToBlob(this.currentCanvas, 'image/png');
                    break;
                case 'jpg':
                    blob = await this.canvasToBlob(this.currentCanvas, 'image/jpeg', 0.95);
                    break;
                case 'svg':
                    blob = await this.generateSVG(content);
                    break;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download error:', error);
            alert('Error downloading QR code');
        }
    }

    canvasToBlob(canvas, type, quality = 1) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, type, quality);
        });
    }

    async generateSVG(content) {
        const ok = await this.ensureQRCodeLoaded();
        if (!ok || typeof window.QRCode === 'undefined') {
            throw new Error('QR library not available');
        }
        const size = parseInt(this.qrSize.value);
        const options = {
            width: size,
            height: size,
            color: {
                dark: this.foregroundColor.value,
                light: this.backgroundColor.value
            },
            errorCorrectionLevel: this.errorCorrection.value,
            margin: 2,
            type: 'svg'
        };

        const svgString = await window.QRCode.toString(content, options);
        return new Blob([svgString], { type: 'image/svg+xml' });
    }

    generateFilename(format) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const typePrefix = this.currentType;
        return `qrcode_${typePrefix}_${timestamp}.${format}`;
    }

    clearAll() {
        // Clear all form inputs
        this.textContent.value = '';
        this.urlContent.value = '';
        this.wifiSSID.value = '';
        this.wifiPassword.value = '';
        this.wifiSecurity.value = 'WPA';
        this.wifiHidden.checked = false;
        this.contactName.value = '';
        this.contactPhone.value = '';
        this.contactEmail.value = '';
        this.contactOrg.value = '';
        this.contactAddress.value = '';
        this.emailTo.value = '';
        this.emailSubject.value = '';
        this.emailBody.value = '';
        this.phoneNumber.value = '';
        this.smsNumber.value = '';
        this.smsMessage.value = '';
        
        // Reset customization
        this.qrSize.value = 256;
        this.foregroundColor.value = '#000000';
        this.backgroundColor.value = '#ffffff';
        this.errorCorrection.value = 'M';
        this.logoUpload.value = '';
        this.logoSize.value = 20;
        this.logoSize.disabled = true;
        this.logoImage = null;
        
        // Update display
        this.updateSliderValues();
        this.clearPreview();
        
        // Reset to text type
        this.selectType('text');
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Utilities: ensure QRCode library is present
    ensureQRCodeLoaded() {
        // QRCode is now always available via our local implementation
        return Promise.resolve(true);
    }
}

// Initialize the QR Generator
const qrGenerator = new QRGenerator();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to clear
    if (e.key === 'Escape') {
        qrGenerator.clearAll();
    }
    
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        qrGenerator.generateQR();
    }
    
    // Ctrl/Cmd + S to download PNG
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (qrGenerator.currentCanvas) {
            qrGenerator.downloadQR('png');
        }
    }
});

// Auto-focus first input on page load
document.addEventListener('DOMContentLoaded', () => {
    qrGenerator.textContent.focus();
});
