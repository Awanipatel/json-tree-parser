# JSON Tree Visualizer

A modern, interactive web application for visualizing JSON data as a hierarchical tree structure. Built with React and React Flow, it provides an intuitive interface for exploring and analyzing JSON data structures.

## ✨ Features

- **Interactive JSON Visualization**
  - Real-time JSON parsing and tree generation
  - Intuitive hierarchical layout
  - Color-coded nodes for different data types
  - Smooth animations and transitions

- **Advanced Search Capabilities**
  - Search by JSON path (e.g., `$.user.address.city`)
  - Array index support (e.g., `items[0].name`)
  - Auto-pan and highlight matching nodes
  - Value-based search fallback

- **User-Friendly Interface**
  - Drag and zoom controls
  - One-click path copying
  - Fit view functionality
  - Responsive design for all devices

- **Theme Support**
  - Light and dark mode
  - Seamless theme switching
  - Consistent styling across themes

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/json-tree-visualizer.git

# Navigate to project directory
cd json-tree-visualizer

# Install dependencies
npm install
```

### Development
```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Building for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🔧 Usage

1. **Input JSON**
   - Paste JSON data into the editor
   - Load sample data using the provided button
   - Real-time validation and error highlighting

2. **Explore the Tree**
   - Drag to pan the view
   - Scroll to zoom in/out
   - Use control buttons for quick actions

3. **Search and Navigate**
   - Enter JSON paths in the search box
   - Click nodes to copy their paths
   - Hover for full path preview

## 🛠️ Technical Details

### Built With
- React 18
- React Flow
- Vite
- CSS Modules

### Architecture
- Component-based structure
- Custom tree layout algorithm
- Efficient state management
- Responsive CSS design

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
