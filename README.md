# JobUtilities - Your Digital Toolkit

A beautiful, modern web application suite for productivity tools. Built with vanilla HTML, CSS, and JavaScript - perfect for hosting on GitHub Pages.

## 🌟 Features

### 🖼️ Image Compressor
- **Drag & Drop Interface** - Simply drag images onto the page or click to browse
- **Dimension Preservation** - Maintains original width and height while reducing file size
- **Multiple Compression Modes**:
  - Quality-based compression (adjustable 10-100%)
  - Target size compression (specify desired KB size)
- **Format Support** - JPEG, PNG, WebP input and output
- **Batch Processing** - Handle multiple images at once

### 📄 PDF Compressor
- **Smart Compression** - Reduce PDF file sizes while maintaining readability
- **Quality Control** - Adjustable compression levels from low to extreme
- **Image Optimization** - Compress embedded images with DPI control
- **Metadata Management** - Option to remove metadata for smaller files
- **Font Optimization** - Optimize fonts for better compression

### 🚀 Dashboard Features
- **Modern UI** - Clean, responsive design with beautiful animations
- **Tool Navigation** - Easy access to all utilities from a central dashboard
- **Future Ready** - Placeholder cards for upcoming utilities
- **Mobile Responsive** - Works perfectly on all devices

## 🎯 Planned Utilities

- **Video Compressor** - Compress video files for web and storage
- **Document Converter** - Convert between document formats
- **QR Code Generator** - Generate custom QR codes
- **Color Palette Tool** - Extract and generate color palettes

## 🚀 Live Demo

Visit the live version: [Your GitHub Pages URL]

## 📋 How to Use

1. **Visit the Dashboard** - Start at `index.html` to see all available tools
2. **Choose a Tool** - Click on any utility card to access the tool
3. **Upload Files** - Drag and drop files or click to browse
4. **Configure Settings** - Adjust compression settings as needed
5. **Process Files** - Click the compress button to process
6. **Download Results** - Download individual files or all at once

## 🛠️ Technology Stack

- **HTML5** - Semantic markup and Canvas/File APIs
- **CSS3** - Modern styling with gradients, animations, and grid layouts
- **JavaScript ES6+** - Vanilla JS with async/await and modern APIs
- **PDF-lib** - Client-side PDF manipulation for PDF compression
- **Font Awesome** - Beautiful icons throughout the interface
- **Google Fonts** - Inter font family for clean typography

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🏗️ Project Structure

```
JobUtilities/
├── index.html                 # Main dashboard
├── styles/
│   ├── dashboard.css         # Dashboard styling
│   ├── utility-base.css      # Base styles for all utilities
│   ├── image-compressor.css  # Image compressor specific styles
│   └── pdf-compressor.css    # PDF compressor specific styles
├── scripts/
│   ├── dashboard.js          # Dashboard functionality
│   ├── image-compressor.js   # Image compression logic
│   └── pdf-compressor.js     # PDF compression logic
├── utilities/
│   ├── image-compressor.html # Image compression tool
│   └── pdf-compressor.html   # PDF compression tool
└── README.md
```

## 🏗️ Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. No build process required - it's pure vanilla web technologies!

## 🌐 GitHub Pages Deployment

1. Fork this repository
2. Go to repository Settings > Pages
3. Select "Deploy from a branch" and choose `main` branch
4. Your site will be available at `https://yourusername.github.io/repository-name`

## ⚡ Performance Features

- **Client-side Processing** - All compression happens in the browser - no server required
- **Efficient Algorithms** - Optimized compression algorithms for best results
- **Memory Management** - Proper cleanup of object URLs to prevent memory leaks
- **Progressive Enhancement** - Graceful fallbacks for older browsers

## 🎨 Design Features

- **Modern Dashboard** - Beautiful card-based interface with hover effects
- **Consistent Theming** - Cohesive design across all utilities
- **Accessibility** - Keyboard navigation and screen reader friendly
- **Animation Effects** - Smooth transitions and micro-interactions
- **Responsive Grid** - Adaptive layouts for all screen sizes

## 📝 Technical Details

### Image Compression
- Uses HTML5 Canvas API for client-side image processing
- Binary search algorithm for target file size optimization
- Support for quality-based and size-based compression modes

### PDF Compression  
- Leverages PDF-lib for client-side PDF manipulation
- Multiple compression levels with different optimization strategies
- Image quality and DPI control for embedded images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- PDF-lib for excellent client-side PDF manipulation
- Font Awesome for the beautiful icons
- Google Fonts for the Inter font family
- The web development community for inspiration and best practices

---

Built with ❤️ for productivity. Perfect for GitHub Pages hosting!
