'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Circle, Pen, Brush, RotateCcw, Download, Home, Grid } from 'lucide-react';

type ArtMode = 'home' | 'zentangle' | 'mandala' | 'stencil' | 'plain';

interface Point {
  x: number;
  y: number;
}

const ArtCreationPlatform: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ArtMode>('home');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  useEffect(() => {
    if (canvasRef.current && currentMode !== 'home') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (currentMode === 'mandala') {
          drawMandalaGuides(ctx);
        } else if (currentMode === 'zentangle') {
          drawZentangleGrid(ctx);
        } else if (currentMode === 'stencil') {
          drawStencilTemplate(ctx);
        }
      }
    }
  }, [currentMode]);

  const drawMandalaGuides = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Draw concentric circles
    for (let i = 1; i <= 6; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 6) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw radial lines
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
    }
  };

  const drawZentangleGrid = (ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    const gridSize = 30;
    
    for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }
  };

  const drawStencilTemplate = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    const templates = [
      // Rectangle template
      { x: 50, y: 50, width: 150, height: 100 },
      { x: 250, y: 50, width: 120, height: 120 },
      // Circle template
      { cx: 500, cy: 100, r: 60 },
      // Triangle template
      { points: [[650, 50], [600, 150], [700, 150]] }
    ];
    
    templates.forEach(template => {
      ctx.beginPath();
      if ('width' in template) {
        ctx.rect(template.x, template.y, template.width, template.height);
      } else if ('r' in template) {
        ctx.arc(template.cx, template.cy, template.r, 0, 2 * Math.PI);
      } else if ('points' in template) {
        const [first, ...rest] = template.points;
        ctx.moveTo(first[0], first[1]);
        rest.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();
      }
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setLastPoint(point);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPoint) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    
    // For mandala mode, create symmetrical patterns
    if (currentMode === 'mandala') {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const segments = 8;
      
      for (let i = 1; i < segments; i++) {
        const angle = (2 * Math.PI * i) / segments;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const rotatedLast = {
          x: centerX + (lastPoint.x - centerX) * cos - (lastPoint.y - centerY) * sin,
          y: centerY + (lastPoint.x - centerX) * sin + (lastPoint.y - centerY) * cos
        };
        
        const rotatedCurrent = {
          x: centerX + (currentPoint.x - centerX) * cos - (currentPoint.y - centerY) * sin,
          y: centerY + (currentPoint.x - centerX) * sin + (currentPoint.y - centerY) * cos
        };
        
        ctx.beginPath();
        ctx.moveTo(rotatedLast.x, rotatedLast.y);
        ctx.lineTo(rotatedCurrent.x, rotatedCurrent.y);
        ctx.stroke();
      }
    }
    
    setLastPoint(currentPoint);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (currentMode === 'mandala') {
          drawMandalaGuides(ctx);
        } else if (currentMode === 'zentangle') {
          drawZentangleGrid(ctx);
        } else if (currentMode === 'stencil') {
          drawStencilTemplate(ctx);
        }
      }
    }
  };

  const downloadArt = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${currentMode}-art-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Artisan Studio
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            Create Beautiful Art with Digital Tools
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unleash your creativity with our comprehensive digital art platform. Choose from Zentangles, Mandalas, Stencil Art, or free-form drawing.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div 
            onClick={() => setCurrentMode('zentangle')}
            className="group cursor-pointer bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-purple-200"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Grid className="w-12 h-12 text-white mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Zentangles</h3>
            <p className="text-gray-600 mb-6">Create intricate patterns with structured repetitive designs and meditative drawing.</p>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-sm text-purple-700 font-medium">Features:</div>
              <div className="text-sm text-purple-600">Grid guides, Pattern tools, Focus mode</div>
            </div>
          </div>
          
          <div 
            onClick={() => setCurrentMode('mandala')}
            className="group cursor-pointer bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-pink-200"
          >
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Circle className="w-12 h-12 text-white mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Mandalas</h3>
            <p className="text-gray-600 mb-6">Design symmetrical circular patterns with automatic radial symmetry and guides.</p>
            <div className="bg-pink-50 rounded-xl p-4">
              <div className="text-sm text-pink-700 font-medium">Features:</div>
              <div className="text-sm text-pink-600">Radial symmetry, Circle guides, Auto-mirror</div>
            </div>
          </div>
          
          <div 
            onClick={() => setCurrentMode('stencil')}
            className="group cursor-pointer bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-indigo-200"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Pen className="w-12 h-12 text-white mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Stencil Art</h3>
            <p className="text-gray-600 mb-6">Use pre-made templates and stencils to create structured artwork with guided shapes.</p>
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="text-sm text-indigo-700 font-medium">Features:</div>
              <div className="text-sm text-indigo-600">Shape templates, Guided drawing, Precision tools</div>
            </div>
          </div>
          
          <div 
            onClick={() => setCurrentMode('plain')}
            className="group cursor-pointer bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-green-200"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Brush className="w-12 h-12 text-white mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Free Drawing</h3>
            <p className="text-gray-600 mb-6">Express yourself freely with unlimited canvas space and versatile drawing tools.</p>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-700 font-medium">Features:</div>
              <div className="text-sm text-green-600">Free canvas, All brushes, No limits</div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Why Choose Artisan Studio?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">Professional Tools</div>
              </div>
              <div>
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Circle className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">Guided Creation</div>
              </div>
              <div>
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">Easy Export</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getModeName = (mode: ArtMode) => {
    switch (mode) {
      case 'zentangle': return 'Zentangle Art';
      case 'mandala': return 'Mandala Creation';
      case 'stencil': return 'Stencil Drawing';
      case 'plain': return 'Free Drawing';
      default: return 'Art Studio';
    }
  };

  const getModeColor = (mode: ArtMode) => {
    switch (mode) {
      case 'zentangle': return 'purple';
      case 'mandala': return 'pink';
      case 'stencil': return 'indigo';
      case 'plain': return 'green';
      default: return 'blue';
    }
  };

  if (currentMode === 'home') {
    return <HomePage />;
  }

  const modeColor = getModeColor(currentMode);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r from-${modeColor}-500 to-${modeColor}-600 text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentMode('home')}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors duration-200"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </button>
              <h1 className="text-2xl font-bold">{getModeName(currentMode)}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentMode === 'zentangle' && (
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors duration-200 ${
                    showGrid ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  <span className="font-medium">Grid</span>
                </button>
              )}
              
              <button
                onClick={clearCanvas}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors duration-200"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-medium">Clear</span>
              </button>
              
              <button
                onClick={downloadArt}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors duration-200"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Tools Panel */}
          <div className="w-64 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Drawing Tools</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Brush Size: {brushSize}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-${modeColor}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color
                </label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 ${
                      brushColor === color ? 'border-gray-800 scale-110' : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            {/* Mode-specific tips */}
            <div className={`mt-8 p-4 bg-${modeColor}-50 rounded-xl`}>
              <h4 className={`font-medium text-${modeColor}-800 mb-2`}>Tips:</h4>
              <div className={`text-sm text-${modeColor}-700`}>
                {currentMode === 'zentangle' && "Focus on repetitive patterns and enjoy the meditative process."}
                {currentMode === 'mandala' && "Your strokes will be mirrored radially for perfect symmetry."}
                {currentMode === 'stencil' && "Use the template guides to create structured designs."}
                {currentMode === 'plain' && "Express yourself freely with unlimited creative possibilities."}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-gray-200 rounded-xl cursor-crosshair max-w-full"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtCreationPlatform;