"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ArrowLeft, Save, Eye, EyeOff, Plus, Trash2, GripVertical,
  Type, Image, MousePointer, Minus, Space, Heading1,
  Check, RefreshCw,
} from "lucide-react";
import { adminGetTemplate, adminUpdateTemplate } from "@/api/admin";
import {
  Block, BlockType, HeaderBlock, TextBlock, ImageBlock,
  ButtonBlock, DividerBlock, SpacerBlock, BlockAlign,
} from "@/types/marketing";

// ─── Block defaults ───────────────────────────────────────────────────────────

function makeBlock(type: BlockType): Block {
  const id = Math.random().toString(36).slice(2);
  switch (type) {
    case "header":  return { id, type, text: "Your Heading", level: 1, align: "center", color: "#111827" };
    case "text":    return { id, type, text: "Write your email content here. Keep it clear and concise.", align: "left", color: "#374151", fontSize: 16 };
    case "image":   return { id, type, src: "", alt: "Image", align: "center", width: "100%" };
    case "button":  return { id, type, text: "Click Here", href: "#", align: "center", bgColor: "#2563eb", textColor: "#ffffff", borderRadius: 8 };
    case "divider": return { id, type, color: "#e5e7eb", thickness: 1 };
    case "spacer":  return { id, type, height: 24 };
  }
}

// ─── Block palette items ──────────────────────────────────────────────────────

const PALETTE: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "header",  label: "Heading",  icon: <Heading1 size={16} /> },
  { type: "text",    label: "Text",     icon: <Type size={16} /> },
  { type: "image",   label: "Image",    icon: <Image size={16} /> },
  { type: "button",  label: "Button",   icon: <MousePointer size={16} /> },
  { type: "divider", label: "Divider",  icon: <Minus size={16} /> },
  { type: "spacer",  label: "Spacer",   icon: <Space size={16} /> },
];

const DND_BLOCK = "BLOCK";
const DND_PALETTE = "PALETTE";

// ─── Draggable palette item ───────────────────────────────────────────────────

function PaletteItem({ type, label, icon }: { type: BlockType; label: string; icon: React.ReactNode }) {
  const [, drag] = useDrag(() => ({ type: DND_PALETTE, item: { blockType: type } }));
  return (
    <div
      ref={drag as any}
      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-grab hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors select-none"
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

// ─── Drop zone between blocks ─────────────────────────────────────────────────

function DropZone({ index, onDrop }: { index: number; onDrop: (type: BlockType, fromIndex: number | null, toIndex: number) => void }) {
  const [{ isOver }, drop] = useDrop<{ blockType?: BlockType; fromIndex?: number }, void, { isOver: boolean }>({
    accept: [DND_PALETTE, DND_BLOCK],
    drop: (item) => {
      if ("blockType" in item && item.blockType) onDrop(item.blockType, null, index);
      else if ("fromIndex" in item && item.fromIndex !== undefined) onDrop("text", item.fromIndex, index);
    },
    collect: (m) => ({ isOver: m.isOver() }),
  });
  return (
    <div ref={drop as any} className={`h-2 mx-2 rounded-full transition-all ${isOver ? "bg-blue-400 h-4" : "bg-transparent"}`} />
  );
}

// ─── Draggable canvas block ───────────────────────────────────────────────────

function CanvasBlock({
  block, index, isSelected, onSelect, onDelete, onMove,
}: {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: DND_BLOCK,
    item: { fromIndex: index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));

  const [, drop] = useDrop<{ fromIndex: number }>({
    accept: DND_BLOCK,
    hover: (item) => {
      if (item.fromIndex !== index) {
        onMove(item.fromIndex, index);
        item.fromIndex = index;
      }
    },
  });

  return (
    <div
      ref={(node) => { dragPreview(node); drop(node); }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`group relative rounded-lg border-2 transition-all cursor-pointer ${
        isDragging ? "opacity-40" : ""
      } ${
        isSelected
          ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
          : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      }`}
    >
      {/* Drag handle */}
      <div
        ref={drag as any}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab p-1 rounded text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={14} />
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-400 hover:text-red-600 z-10"
      >
        <Trash2 size={12} />
      </button>
      {/* Block preview */}
      <div className="px-6 py-2">
        <BlockPreview block={block} />
      </div>
    </div>
  );
}

// ─── Block visual preview ─────────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {
    case "header": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3";
      const sizes = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" };
      return (
        <Tag
          style={{ color: block.color, textAlign: block.align }}
          className={`font-bold ${sizes[block.level]}`}
        >
          {block.text}
        </Tag>
      );
    }
    case "text":
      return (
        <p style={{ color: block.color, textAlign: block.align, fontSize: block.fontSize }}>
          {block.text}
        </p>
      );
    case "image":
      return (
        <div style={{ textAlign: block.align }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.src} alt={block.alt} style={{ width: block.width, display: "inline-block" }} />
          ) : (
            <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg" style={{ width: block.width, height: 120 }}>
              <Image size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div style={{ textAlign: block.align }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: block.bgColor,
              color: block.textColor,
              borderRadius: block.borderRadius,
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {block.text}
          </span>
        </div>
      );
    case "divider":
      return (
        <hr style={{ borderColor: block.color, borderTopWidth: block.thickness }} />
      );
    case "spacer":
      return <div style={{ height: block.height }} />;
  }
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropertiesPanel({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const AlignButtons = ({ value, onSet }: { value: BlockAlign; onSet: (v: BlockAlign) => void }) => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as BlockAlign[]).map((a) => (
        <button
          key={a}
          onClick={() => onSet(a)}
          className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
            value === a
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
              : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm dark:bg-gray-800 dark:text-gray-200";

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-4">
          <Field label="Text">
            <input className={inputCls} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          </Field>
          <Field label="Level">
            <div className="flex gap-1">
              {([1, 2, 3] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onChange({ ...block, level: l })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    block.level === l ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  H{l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Align"><AlignButtons value={block.align} onSet={(v) => onChange({ ...block, align: v })} /></Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              <input className={`${inputCls} flex-1`} value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} />
            </div>
          </Field>
        </div>
      );

    case "text":
      return (
        <div className="space-y-4">
          <Field label="Content">
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
            />
          </Field>
          <Field label="Align"><AlignButtons value={block.align} onSet={(v) => onChange({ ...block, align: v })} /></Field>
          <Field label="Font Size">
            <div className="flex items-center gap-2">
              <input
                type="range" min={12} max={32} step={1}
                value={block.fontSize}
                onChange={(e) => onChange({ ...block, fontSize: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{block.fontSize}px</span>
            </div>
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              <input className={`${inputCls} flex-1`} value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} />
            </div>
          </Field>
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <Field label="Image URL">
            <input className={inputCls} value={block.src} onChange={(e) => onChange({ ...block, src: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Alt Text">
            <input className={inputCls} value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          </Field>
          <Field label="Link (optional)">
            <input className={inputCls} value={block.link ?? ""} onChange={(e) => onChange({ ...block, link: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Width">
            <input className={inputCls} value={block.width} onChange={(e) => onChange({ ...block, width: e.target.value })} placeholder="100% or 400px" />
          </Field>
          <Field label="Align"><AlignButtons value={block.align} onSet={(v) => onChange({ ...block, align: v })} /></Field>
        </div>
      );

    case "button":
      return (
        <div className="space-y-4">
          <Field label="Button Text">
            <input className={inputCls} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          </Field>
          <Field label="Link URL">
            <input className={inputCls} value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Align"><AlignButtons value={block.align} onSet={(v) => onChange({ ...block, align: v })} /></Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={block.bgColor} onChange={(e) => onChange({ ...block, bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              <input className={`${inputCls} flex-1`} value={block.bgColor} onChange={(e) => onChange({ ...block, bgColor: e.target.value })} />
            </div>
          </Field>
          <Field label="Text Color">
            <div className="flex items-center gap-2">
              <input type="color" value={block.textColor} onChange={(e) => onChange({ ...block, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              <input className={`${inputCls} flex-1`} value={block.textColor} onChange={(e) => onChange({ ...block, textColor: e.target.value })} />
            </div>
          </Field>
          <Field label="Border Radius">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={50} value={block.borderRadius} onChange={(e) => onChange({ ...block, borderRadius: Number(e.target.value) })} className="flex-1" />
              <span className="text-xs text-gray-500 w-8">{block.borderRadius}px</span>
            </div>
          </Field>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-4">
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              <input className={`${inputCls} flex-1`} value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} />
            </div>
          </Field>
          <Field label="Thickness">
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={8} value={block.thickness} onChange={(e) => onChange({ ...block, thickness: Number(e.target.value) })} className="flex-1" />
              <span className="text-xs text-gray-500 w-8">{block.thickness}px</span>
            </div>
          </Field>
        </div>
      );

    case "spacer":
      return (
        <div className="space-y-4">
          <Field label="Height">
            <div className="flex items-center gap-2">
              <input type="range" min={8} max={120} step={4} value={block.height} onChange={(e) => onChange({ ...block, height: Number(e.target.value) })} className="flex-1" />
              <span className="text-xs text-gray-500 w-8">{block.height}px</span>
            </div>
          </Field>
        </div>
      );
  }
}

// ─── Main editor ──────────────────────────────────────────────────────────────

function TemplateEditorInner() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    adminGetTemplate(id).then((rs) => {
      if (rs?.success) {
        setName(rs.data.name ?? "");
        setSubject(rs.data.subject ?? "");
        setBlocks(rs.data.blocks ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  const handleDrop = useCallback(
    (type: BlockType, fromIndex: number | null, toIndex: number) => {
      if (fromIndex === null) {
        const block = makeBlock(type);
        setBlocks((prev) => {
          const next = [...prev];
          next.splice(toIndex, 0, block);
          return next;
        });
        setSelectedId(block.id);
      }
    },
    []
  );

  const moveBlock = useCallback((from: number, to: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateBlock = (updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const addBlock = (type: BlockType) => {
    const block = makeBlock(type);
    const idx = selectedId ? blocks.findIndex((b) => b.id === selectedId) + 1 : blocks.length;
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(idx, 0, block);
      return next;
    });
    setSelectedId(block.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateTemplate(id, { name, subject, blocks });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const [, canvasDrop] = useDrop<{ blockType?: BlockType }>({
    accept: DND_PALETTE,
    drop: (item) => {
      if (item.blockType) addBlock(item.blockType);
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
        <button
          onClick={() => router.push("/marketing?tab=templates")}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm font-semibold text-gray-800 dark:text-white bg-transparent border-none outline-none flex-1 min-w-0"
          placeholder="Template name…"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none w-64"
          placeholder="Email subject line…"
        />
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? "Edit" : "Preview"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {showPreview ? (
        /* Preview mode */
        <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 space-y-0">
              {blocks.map((block) => (
                <div key={block.id} className="py-1">
                  <BlockPreview block={block} />
                </div>
              ))}
              {blocks.length === 0 && (
                <p className="text-center text-gray-300 dark:text-gray-600 py-16">Empty template</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Edit mode — 3 columns */
        <div className="flex flex-1 overflow-hidden">
          {/* Block palette */}
          <div className="w-40 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Blocks</p>
              <div className="grid grid-cols-2 gap-2">
                {PALETTE.map((p) => (
                  <PaletteItem key={p.type} type={p.type} label={p.label} icon={p.icon} />
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasDrop as any}
            className="flex-1 overflow-y-auto p-6"
            onClick={() => setSelectedId(null)}
          >
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm min-h-[400px] p-8">
              <DropZone index={0} onDrop={handleDrop} />
              {blocks.map((block, i) => (
                <div key={block.id}>
                  <CanvasBlock
                    block={block}
                    index={i}
                    isSelected={selectedId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onMove={moveBlock}
                  />
                  <DropZone index={i + 1} onDrop={handleDrop} />
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600 gap-3 pointer-events-none">
                  <Plus size={32} />
                  <p className="text-sm">Drag blocks here or click a type in the palette</p>
                </div>
              )}
            </div>
          </div>

          {/* Properties panel */}
          <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-4">
              {selectedBlock ? (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4 capitalize">
                    {selectedBlock.type} Properties
                  </p>
                  <PropertiesPanel
                    block={selectedBlock}
                    onChange={updateBlock}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-gray-600 gap-2">
                  <p className="text-xs text-center">Select a block to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateEditor() {
  return (
    <DndProvider backend={HTML5Backend}>
      <TemplateEditorInner />
    </DndProvider>
  );
}
