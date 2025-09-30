// path: app/(patents)/components/InnovationInsights.tsx
"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2, Save, Edit, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Textarea } from "@/components/ui/textarea";
import { Footnotes } from "@/components/citation-link";

// Markdown rendering
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Element, Properties } from "hast";

declare global {
  interface Window {
    addKnowledgeEntry?: (
      section: string,
      question: string,
      content: string,
      patentId: string
    ) => void;
  }
}

interface InnovationInsightsRef {
  generateContent: () => void;
}

interface InnovationInsightsProps {
  response: string;
  question: string;
  metaData: {
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }[];
  lastSaved: string;
  patentId: string;
  setLastSaved: Dispatch<SetStateAction<string>>;
  onCitationClick?: (chunkId: number) => void;
}

/**
 * Convert inline tokens like `[44]` into <citation data-citation="44">[44]</citation>.
 * Keeps citation UX while using Markdown.
 */
const rehypeCitations: Plugin<[], Root> = () => (tree: Root) => {
  const CITATION_RE = /\[(\d{1,4})\]/g;
  visit(
    tree as any,
    "text",
    (node: Text, index: number | null, parent: any) => {
      const value = node.value;
      if (!value || !parent || typeof index !== "number") return;
      if (!CITATION_RE.test(value)) return;

      const fragments: (Text | Element)[] = [];
      let last = 0;
      CITATION_RE.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = CITATION_RE.exec(value)) !== null) {
        const [raw, idStr] = match;
        const start = match.index;
        const end = start + raw.length;

        if (start > last)
          fragments.push({ type: "text", value: value.slice(last, start) });

        const id = Number(idStr);
        const props: Properties = {
          "data-citation": id,
          className:
            "inline align-super relative top-[2px] text-[0.65rem] leading-none mx-0 cursor-pointer text-primary hover:underline",
          title: `Jump to citation ${id}`,
        };

        fragments.push({
          type: "element",
          tagName: "citation",
          properties: props,
          children: [{ type: "text", value: `[${id}]` }],
        });

        last = end;
      }

      if (last < value.length)
        fragments.push({ type: "text", value: value.slice(last) });

      parent.children.splice(index, 1, ...fragments);
    }
  );
};

const InnovationInsights = forwardRef<
  InnovationInsightsRef,
  InnovationInsightsProps
>(
  (
    {
      response,
      metaData,
      question,
      lastSaved,
      setLastSaved,
      patentId,
      onCitationClick,
    },
    ref
  ) => {
    const [content, setContent] = useState<string>(response || "");
    const [editedContent, setEditedContent] = useState<string>(response || "");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
      setContent(response || "");
      setEditedContent(response || "");
    }, [response]);

    useImperativeHandle(ref, () => ({
      generateContent: () => generateContent(),
    }));

    const generateContent = () => {
      setIsLoading(true);

      setTimeout(() => {
        const generated = `# iPhone Innovation Framework\n\nBased on our market analysis and technical research, we've identified the following innovation framework for the iPhone:\n\n## 1. Market Gap Analysis\n\nThe iPhone addresses several critical market needs:\n\n- **User Experience:** Intuitive interface that redefined mobile interaction\n- **Integration:** Seamless ecosystem connecting devices and services\n- **Security:** Advanced protection of user data and privacy\n- **Performance:** Balance of power and efficiency in mobile computing\n\n## 2. Novel Elements\n\nKey innovations that differentiate the iPhone:\n\n- **Face ID:** Revolutionary 3D facial recognition system\n- **Apple Silicon:** Custom chip design for optimal performance\n- **ProMotion:** Adaptive refresh rate display technology\n- **Computational Photography:** Advanced image processing capabilities\n\n## 3. Competitive Advantage\n\nThe iPhone maintains market leadership through:\n\n- **Vertical Integration:** Control over hardware, software, and services\n- **Brand Premium:** Strong market position and customer loyalty\n- **App Ecosystem:** Largest mobile software marketplace\n- **Privacy Focus:** Industry-leading security features\n\n## 4. Market Applications\n\nThe iPhone serves multiple market segments:\n\n- **Consumer:** Primary smartphone for daily use\n- **Professional:** Creative and business tools\n- **Enterprise:** Secure corporate deployment\n- **Healthcare:** Medical imaging and monitoring\n- **Education:** Learning and development platform\n\n## 5. Innovation Strategy\n\nApple's ongoing innovation strategy includes:\n\n- Annual hardware upgrades with significant improvements\n- Regular software updates with new features\n- Expansion into new use cases (AR/VR)\n- Environmental sustainability initiatives\n- Privacy-focused feature development\n\nThis innovation framework demonstrates Apple's commitment to pushing boundaries in mobile technology while maintaining user trust and satisfaction.`;
        setContent(generated);
        setEditedContent(generated);
        setIsLoading(false);
      }, 1000);
    };

    const handleSave = () => {
      if (!editedContent.trim()) return;

      setIsSaving(true);

      if (typeof window !== "undefined" && window.addKnowledgeEntry) {
        // Extract chunk IDs and document names from metadata
        const chunkIds = metaData.map((item) => item.chunk_id);
        const docNames = [...new Set(metaData.map((item) => item.filename.replace(/\.pdf$/i, '')))];
        
        window.addKnowledgeEntry(
          "Innovation",
          question,
          editedContent,
          patentId,
          false,
          chunkIds,
          docNames
        );
      }

      setTimeout(() => {
        setContent(editedContent);
        setLastSaved(editedContent);
        setIsSaving(false);
        setIsEditing(false);
        toast({
          title: "Insights saved successfully",
          description:
            "Your innovation insights have been saved to the project.",
          duration: 3000,
        });
      }, 300);
    };

    const handleEdit = () => {
      setIsEditing(true);
      setEditedContent(content || "");
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedContent(content || "");
    };

    const components = {
      citation: ({ children, ...props }: any) => {
        const id = Number(props["data-citation"]);
        return (
          <sup
            role="button"
            tabIndex={0}
            className="inline align-super relative top-[2px] text-[0.65rem] leading-none mx-0 cursor-pointer text-primary hover:underline focus:outline-none"
            title={`Jump to citation ${id}`}
            onClick={() => onCitationClick?.(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onCitationClick?.(id);
            }}
            data-citation={id}
          >
            {children}
          </sup>
        );
      },
      h1: (props: any) => (
        <h2 className="mt-6 scroll-m-20 text-2xl font-semibold" {...props} />
      ),
      h2: (props: any) => (
        <h3 className="mt-6 scroll-m-20 text-xl font-semibold" {...props} />
      ),
      h3: (props: any) => (
        <h4 className="mt-6 scroll-m-20 text-lg font-semibold" {...props} />
      ),
      li: (props: any) => <li className="my-1" {...props} />,
      p: (props: any) => <p className="leading-7" {...props} />,
      a: (props: any) => (
        <a
          className="underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
          {...props}
        />
      ),
      code: (props: any) => (
        <code className="rounded bg-muted px-1 py-0.5" {...props} />
      ),
      pre: (props: any) => (
        <pre className="rounded bg-muted p-3 overflow-auto" {...props} />
      ),
      ul: (props: any) => <ul className="list-disc pl-6" {...props} />,
      ol: (props: any) => <ol className="list-decimal pl-6" {...props} />,
      blockquote: (props: any) => (
        <blockquote
          className="mt-6 border-l-2 pl-6 italic text-muted-foreground"
          {...props}
        />
      ),
      table: (props: any) => (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" {...props} />
        </div>
      ),
      th: (props: any) => (
        <th className="border-b px-2 py-1 text-left" {...props} />
      ),
      td: (props: any) => (
        <td className="border-b px-2 py-1 align-top" {...props} />
      ),
    } as const;

    const isSaved = lastSaved.trim() === content.trim();

    return (
      <>
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Innovation Insights
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  {/* <DialogTrigger asChild>
                  <Button variant=\"outline\" size=\"sm\">Meta-data</Button>
                </DialogTrigger> */}
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Approach Meta-data</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-y-auto">
                      {metaData.length > 0 ? (
                        <div className="space-y-3 text-sm">
                          {metaData.map((item, index) => (
                            <div
                              key={`${item.chunk_id}-${index}`}
                              className="border border-gray-300 p-3 rounded-md"
                            >
                              <p>
                                <span className="font-semibold">Chunk ID:</span>{" "}
                                {item.chunk_id}
                              </p>
                              <p>
                                <span className="font-semibold">Filename:</span>{" "}
                                {item.filename}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Page Number:
                                </span>{" "}
                                {item.page_number}
                              </p>
                              <p>
                                <span className="font-semibold">Text:</span>{" "}
                                <span className="italic">{item.text}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">
                          No metadata available.
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {content && !isEditing && (
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}

                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!content || isSaving || isSaved}
                  >
                    {isSaved ? "Saved" : isSaving ? "Saving" : "Save"}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 relative">
            {content ? (
              isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="prose max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeCitations]}
                    components={components as any}
                  >
                    {content}
                  </ReactMarkdown>

                  {onCitationClick && (
                    <div className="mt-8">
                      <Footnotes
                        message={content}
                        chunks={metaData}
                        onCitationClick={onCitationClick}
                      />
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No insights generated yet
                  </h3>
                  <p className="text-muted-foreground">
                    Send a message in the chat to generate insights.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="font-medium">
                    Generating Innovation Insights...
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a few moments
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Toaster />
      </>
    );
  }
);

InnovationInsights.displayName = "InnovationInsights";
export default InnovationInsights;
