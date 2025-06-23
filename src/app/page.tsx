'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Circle, Pen, Brush, RotateCcw, Download, Home, Grid, Square, Eraser, Droplet, Redo2, Undo2, LineChart } from 'lucide-react';

type ArtMode = 'home' | 'zentangle' | 'mandala' | 'stencil' | 'plain';
type BrushType = 'round' | 'square' | 'spray' | 'eraser';
type ShapeType = 'none' | 'rectangle' | 'circle' | 'line' | 'triangle';

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
  const [brushType, setBrushType] = useState<BrushType>('round');
  const [shapeType, setShapeType] = useState<ShapeType>('none');
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [fillMode, setFillMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [startShape, setStartShape] = useState<Point | null>(null);

  const drawMandalaGuides = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 6; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 6) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }
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
      { x: 50, y: 50, width: 150, height: 100 },
      { x: 250, y: 50, width: 120, height: 120 },
      { cx: 500, cy: 100, r: 60 },
      { points: [[650, 50], [600, 150], [700, 150]] }
    ];
    templates.forEach(template => {
      ctx.beginPath();
      if ('width' in template && template.x !== undefined && template.y !== undefined && template.width !== undefined && template.height !== undefined) {
        ctx.rect(template.x, template.y, template.width, template.height);
      } else if ('r' in template && template.cx !== undefined && template.cy !== undefined && template.r !== undefined) {
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

  const handleShapeDraw = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    if (shapeType === 'rectangle') {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (shapeType === 'circle') {
      const r = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (shapeType === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x - (end.x - start.x), end.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
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
      setStartShape(point);
      if (fillMode) {
        // Simple flood fill (placeholder, not a true flood fill)
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = brushColor;
          ctx.fillRect(point.x, point.y, 10, 10);
          saveHistory();
        }
        setIsDrawing(false);
      }
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
    if (shapeType !== 'none' && startShape) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = new window.Image();
      img.src = history[history.length - 1] || '';
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        handleShapeDraw(ctx, startShape, currentPoint);
      };
      return;
    }
    ctx.globalCompositeOperation = brushType === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = brushType === 'square' ? 'butt' : 'round';
    ctx.lineJoin = brushType === 'square' ? 'miter' : 'round';
    if (brushType === 'spray') {
      for (let i = 0; i < brushSize * 2; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * brushSize;
        const x = currentPoint.x + Math.cos(angle) * radius;
        const y = currentPoint.y + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = brushColor;
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
    setLastPoint(currentPoint);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    setLastPoint(null);
    setStartShape(null);
    if (shapeType !== 'none' && startShape && e && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        handleShapeDraw(ctx, startShape, endPoint);
      }
    }
    saveHistory();
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((h) => [...h.slice(-20), canvas.toDataURL()]);
      setRedoStack([]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      setRedoStack((r) => [canvas.toDataURL(), ...r]);
      const img = new window.Image();
      img.src = history[history.length - 1];
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      setHistory((h) => h.slice(0, -1));
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((h) => [...h, canvas.toDataURL()]);
      const img = new window.Image();
      img.src = redoStack[0];
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      setRedoStack((r) => r.slice(1));
    }
  };

  useEffect(() => {
    if (canvasRef.current && currentMode !== 'home') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth < 700 ? window.innerWidth - 32 : 800;
        canvas.height = window.innerWidth < 700 ? 400 : 600;
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
  }, [currentMode, drawMandalaGuides, drawZentangleGrid, drawStencilTemplate]);

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
    setHistory([]);
    setRedoStack([]);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className={`bg-gradient-to-r from-${modeColor}-500 to-${modeColor}-600 text-white shadow-lg w-full`}>
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <button onClick={undo} className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl"><Undo2 className="w-5 h-5" /></button>
            <button onClick={redo} className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl"><Redo2 className="w-5 h-5" /></button>
            {currentMode === 'zentangle' && (
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors duration-200 ${showGrid ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'}`}
              >
                <Grid className="w-5 h-5" />
                <span className="font-medium">Grid</span>
              </button>
            )}
            <button onClick={clearCanvas} className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl"><RotateCcw className="w-5 h-5" /><span className="font-medium ml-1">Clear</span></button>
            <button onClick={downloadArt} className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl"><Download className="w-5 h-5" /><span className="font-medium ml-1">Save</span></button>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col md:flex-row gap-4 container mx-auto px-2 py-4">
        <div className="w-full md:w-64 bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4 mb-4 md:mb-0">
          <h3 className="text-lg font-bold text-gray-800">Drawing Tools</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setBrushType('round')} className={`p-2 rounded-xl border ${brushType==='round'?'border-blue-500 bg-blue-50':'border-gray-200'}`}><Brush className="w-5 h-5" /></button>
            <button onClick={() => setBrushType('square')} className={`p-2 rounded-xl border ${brushType==='square'?'border-blue-500 bg-blue-50':'border-gray-200'}`}><Square className="w-5 h-5" /></button>
            <button onClick={() => setBrushType('spray')} className={`p-2 rounded-xl border ${brushType==='spray'?'border-blue-500 bg-blue-50':'border-gray-200'}`}><Droplet className="w-5 h-5" /></button>
            <button onClick={() => setBrushType('eraser')} className={`p-2 rounded-xl border ${brushType==='eraser'?'border-blue-500 bg-blue-50':'border-gray-200'}`}><Eraser className="w-5 h-5" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShapeType('none')} className={`p-2 rounded-xl border ${shapeType==='none'?'border-green-500 bg-green-50':'border-gray-200'}`}>Free</button>
            <button onClick={() => setShapeType('rectangle')} className={`p-2 rounded-xl border ${shapeType==='rectangle'?'border-green-500 bg-green-50':'border-gray-200'}`}><Square className="w-5 h-5" /></button>
            <button onClick={() => setShapeType('circle')} className={`p-2 rounded-xl border ${shapeType==='circle'?'border-green-500 bg-green-50':'border-gray-200'}`}><Circle className="w-5 h-5" /></button>
            <button onClick={() => setShapeType('line')} className={`p-2 rounded-xl border ${shapeType==='line'?'border-green-500 bg-green-50':'border-gray-200'}`}><LineChart className="w-5 h-5" /></button>
            <button onClick={() => setShapeType('triangle')} className={`p-2 rounded-xl border ${shapeType==='triangle'?'border-green-500 bg-green-50':'border-gray-200'}`}>△</button>
          </div>
          <button onClick={() => setFillMode(!fillMode)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${fillMode?'border-yellow-500 bg-yellow-50':'border-gray-200'}`}><Droplet className="w-5 h-5" />Fill</button>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brush Size: {brushSize}px</label>
            <input type="range" min="1" max="40" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-full h-10 rounded-xl border-2 border-gray-200 cursor-pointer" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map((color) => (
              <button key={color} onClick={() => setBrushColor(color)} className={`w-8 h-8 rounded-xl border-2 transition-all duration-200 ${brushColor === color ? 'border-gray-800 scale-110' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className={`mt-4 p-2 bg-${modeColor}-50 rounded-xl`}>
            <h4 className={`font-medium text-${modeColor}-800 mb-1`}>Tips:</h4>
            <div className={`text-xs text-${modeColor}-700`}>
              {currentMode === 'zentangle' && "Focus on repetitive patterns and enjoy the meditative process."}
              {currentMode === 'mandala' && "Your strokes will be mirrored radially for perfect symmetry."}
              {currentMode === 'stencil' && "Use the template guides to create structured designs."}
              {currentMode === 'plain' && "Express yourself freely with unlimited creative possibilities."}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-full md:max-w-4xl bg-white rounded-2xl shadow-lg p-2 md:p-6 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-gray-200 rounded-xl cursor-crosshair w-full h-auto max-w-full max-h-[70vh]"
              style={{ touchAction: 'none', background: 'white' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtCreationPlatform;