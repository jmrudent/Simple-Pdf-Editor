import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderPageToCanvas } from '../services/pdfService';
import { PDFAttachment } from '../types';
import { Trash2, Move } from 'lucide-react';

interface PDFWorkspaceProps {
  pdfData: ArrayBuffer;
  pageIndex: number;
  scale: number;
  attachments: PDFAttachment[];
  onAddAttachment: (att: PDFAttachment) => void;
  onUpdateAttachment: (att: PDFAttachment) => void;
  onRemoveAttachment: (id: string) => void;
}

export const PDFWorkspace: React.FC<PDFWorkspaceProps> = ({
  pdfData,
  pageIndex,
  scale,
  attachments,
  onAddAttachment,
  onUpdateAttachment,
  onRemoveAttachment
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Render PDF when data or page changes
  useEffect(() => {
    if (canvasRef.current && pdfData) {
      renderPageToCanvas(pdfData, pageIndex, canvasRef.current, scale);
    }
  }, [pdfData, pageIndex, scale]);

  // Handle Double Click to add text
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Check if we clicked on an existing input (ignore)
    if ((e.target as HTMLElement).closest('.attachment-input')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAttachment: PDFAttachment = {
      id: crypto.randomUUID(),
      x,
      y: y - 10, // Slight offset to center vertically on click
      width: 200,
      height: 30,
      text: "Nouveau texte",
      fontSize: 16,
      pageIndex
    };

    onAddAttachment(newAttachment);
  };

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent container click
    const attachment = attachments.find(a => a.id === id);
    if (attachment && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setDragOffset({
        x: mouseX - attachment.x,
        y: mouseY - attachment.y
      });
      setDragId(id);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Simple boundary check (optional, can let user drag off if needed)
      // const maxX = rect.width - 50;
      // const maxY = rect.height - 20;

      const attachment = attachments.find(a => a.id === dragId);
      if (attachment) {
        onUpdateAttachment({ ...attachment, x, y });
      }
    }
  }, [dragId, dragOffset, attachments, onUpdateAttachment]);

  const handleMouseUp = useCallback(() => {
    setDragId(null);
  }, []);

  useEffect(() => {
    if (dragId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragId, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative inline-block shadow-lg bg-white mt-8 mb-8">
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="block" />

      {/* Interaction Layer */}
      <div 
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair z-10"
        onDoubleClick={handleDoubleClick}
      >
        {attachments
          .filter(att => att.pageIndex === pageIndex)
          .map(att => (
            <div
              key={att.id}
              className="absolute group attachment-input flex items-center"
              style={{
                left: att.x,
                top: att.y,
              }}
            >
              {/* Drag Handle */}
              <div 
                className="absolute -left-6 top-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow text-gray-500 hover:text-blue-600"
                onMouseDown={(e) => handleMouseDown(e, att.id)}
              >
                <Move size={14} />
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={att.text}
                onChange={(e) => onUpdateAttachment({ ...att, text: e.target.value })}
                className="bg-transparent border border-transparent hover:border-blue-300 focus:border-blue-500 focus:bg-white/50 focus:ring-2 focus:ring-blue-200 outline-none px-2 py-1 rounded transition-all text-gray-900 font-sans"
                style={{ 
                  fontSize: `${att.fontSize}px`,
                  minWidth: '50px'
                }}
                autoFocus={att.text === "Nouveau texte"}
              />
              
              {/* Delete Button */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveAttachment(att.id); }}
                className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow text-gray-500 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
