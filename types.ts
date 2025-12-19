export interface PDFAttachment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  pageIndex: number;
}

export interface PDFPageInfo {
  width: number;
  height: number;
  scale: number;
}

export enum EditorMode {
  IDLE = 'IDLE',
  ADDING_TEXT = 'ADDING_TEXT',
  DRAGGING = 'DRAGGING',
}
