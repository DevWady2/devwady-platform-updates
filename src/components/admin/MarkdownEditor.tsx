import { useRef, useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bold, Italic, Heading2, Link2, Code2, List } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
  placeholder?: string;
}

const tools = [
  { icon: Bold, label: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { icon: Italic, label: "Italic", before: "_", after: "_", placeholder: "italic text" },
  { icon: Heading2, label: "Heading", before: "## ", after: "", placeholder: "Heading" },
  { icon: Link2, label: "Link", before: "[", after: "](url)", placeholder: "link text" },
  { icon: Code2, label: "Code", before: "`", after: "`", placeholder: "code" },
  { icon: List, label: "List", before: "- ", after: "", placeholder: "item" },
] as const;

export default function MarkdownEditor({ value, onChange, dir, placeholder }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState("write");

  const insert = useCallback((before: string, after: string, ph: string) => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || ph;
    const newText = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }, [value, onChange]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/50 border-b border-border flex-wrap">
        {tools.map((t) => (
          <Button
            key={t.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={t.label}
            onClick={() => insert(t.before, t.after, t.placeholder)}
          >
            <t.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
        <span className="ms-auto text-[10px] text-muted-foreground hidden sm:inline">
          Markdown: ## heading, **bold**, _italic_, [link](url)
        </span>
      </div>

      {/* Desktop: side-by-side | Mobile: tabs */}
      <div className="hidden md:grid md:grid-cols-2 md:divide-x divide-border min-h-[240px]">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          placeholder={placeholder || "Write markdown…"}
          className="border-0 rounded-none resize-none min-h-[240px] focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={10}
        />
        <div className="p-4 overflow-y-auto max-h-[400px] prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary" dir={dir}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground text-sm italic">Preview will appear here…</p>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full rounded-none border-b border-border">
            <TabsTrigger value="write" className="flex-1">Write</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-0">
            <Textarea
              ref={tab === "write" ? ref : undefined}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              dir={dir}
              placeholder={placeholder || "Write markdown…"}
              className="border-0 rounded-none resize-none min-h-[200px] focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={8}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div className="p-4 min-h-[200px] prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary" dir={dir}>
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm italic">Preview will appear here…</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
