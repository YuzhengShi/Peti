import { useRef, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

const MIN_W = 320;
const MIN_H = 200;

export function DraggableWindow({ title, children, defaultWidth = 680, defaultHeight = 560 }: Props) {
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => navigate('/'), 120);
  }, [navigate]);

  const [pos, setPos] = useState(() => ({
    x: Math.max(0, (window.innerWidth - defaultWidth) / 2),
    y: Math.max(0, (window.innerHeight - defaultHeight) / 2),
  }));
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });

  // Drag state
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Resize state
  type Edge = 'e' | 's' | 'se' | 'sw' | 'w' | 'n' | 'ne' | 'nw';
  const resizeState = useRef<{
    edge: Edge;
    startX: number; startY: number;
    startW: number; startH: number;
    startPosX: number; startPosY: number;
  } | null>(null);

  function onTitleMouseDown(e: React.MouseEvent) {
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
    e.preventDefault();
  }

  function onResizeMouseDown(e: React.MouseEvent, edge: Edge) {
    resizeState.current = {
      edge,
      startX: e.clientX, startY: e.clientY,
      startW: size.w, startH: size.h,
      startPosX: pos.x, startPosY: pos.y,
    };
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragState.current) {
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        setPos({
          x: Math.max(0, Math.min(dragState.current.startPosX + dx, window.innerWidth - size.w)),
          y: Math.max(0, dragState.current.startPosY + dy),
        });
      }
      if (resizeState.current) {
        const { edge, startX, startY, startW, startH, startPosX, startPosY } = resizeState.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newW = startW, newH = startH, newX = startPosX, newY = startPosY;

        if (edge.includes('e')) newW = Math.max(MIN_W, startW + dx);
        if (edge.includes('s')) newH = Math.max(MIN_H, startH + dy);
        if (edge.includes('w')) { newW = Math.max(MIN_W, startW - dx); newX = startPosX + startW - newW; }
        if (edge.includes('n')) { newH = Math.max(MIN_H, startH - dy); newY = startPosY + startH - newH; }

        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      }
    }
    function onMouseUp() {
      dragState.current = null;
      resizeState.current = null;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [size.w]);

  return (
    <div
      className={`draggable-window${closing ? ' draggable-window-closing' : ''}`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar */}
      <div className="draggable-titlebar" onMouseDown={onTitleMouseDown}>
        <span className="draggable-title">{title}</span>
        <button className="draggable-close" onClick={handleClose} aria-label="Close">×</button>
      </div>

      {/* Content */}
      <div className="draggable-body">{children}</div>

      {/* Resize handles */}
      <div className="resize-handle resize-e"  onMouseDown={e => onResizeMouseDown(e, 'e')} />
      <div className="resize-handle resize-s"  onMouseDown={e => onResizeMouseDown(e, 's')} />
      <div className="resize-handle resize-w"  onMouseDown={e => onResizeMouseDown(e, 'w')} />
      <div className="resize-handle resize-n"  onMouseDown={e => onResizeMouseDown(e, 'n')} />
      <div className="resize-handle resize-se" onMouseDown={e => onResizeMouseDown(e, 'se')} />
      <div className="resize-handle resize-sw" onMouseDown={e => onResizeMouseDown(e, 'sw')} />
      <div className="resize-handle resize-ne" onMouseDown={e => onResizeMouseDown(e, 'ne')} />
      <div className="resize-handle resize-nw" onMouseDown={e => onResizeMouseDown(e, 'nw')} />
    </div>
  );
}
