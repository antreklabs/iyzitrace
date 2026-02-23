import React, { useRef, useCallback, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';

import { useTheme } from "@agent-manager/components/ThemeProvider";

// Prism dark theme styles (VS Code-like)
const prismDarkStyles = `
.prism-editor .token.comment { color: #6a9955; font-style: italic; }
.prism-editor .token.string { color: #ce9178; }
.prism-editor .token.number { color: #b5cea8; }
.prism-editor .token.boolean { color: #569cd6; }
.prism-editor .token.null { color: #569cd6; }
.prism-editor .token.keyword { color: #569cd6; }
.prism-editor .token.key { color: #9cdcfe; }
.prism-editor .token.punctuation { color: #d4d4d4; }
.prism-editor .token.atrule { color: #c586c0; }
.prism-editor .token.important { color: #569cd6; }
.prism-editor .token.deleted { color: #ce9178; }
.prism-editor .token.tag { color: #569cd6; }
`;

// Prism light theme styles
const prismLightStyles = `
.prism-editor .token.comment { color: #008000; font-style: italic; }
.prism-editor .token.string { color: #a31515; }
.prism-editor .token.number { color: #098658; }
.prism-editor .token.boolean { color: #0000ff; }
.prism-editor .token.null { color: #0000ff; }
.prism-editor .token.keyword { color: #0000ff; }
.prism-editor .token.key { color: #001080; }
.prism-editor .token.punctuation { color: #000000; }
.prism-editor .token.atrule { color: #af00db; }
.prism-editor .token.important { color: #0000ff; }
.prism-editor .token.deleted { color: #a31515; }
.prism-editor .token.tag { color: #800000; }
`;

interface PrismYamlEditorProps {
    value: string;
    onChange: (value: string) => void;
    readonly?: boolean;
    height?: string;
    className?: string;
}

export function PrismYamlEditor({
    value,
    onChange,
    readonly = false,
    height = "100%",
    className = "",
}: PrismYamlEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const { theme } = useTheme();

    // Highlight code
    const highlightedCode = useMemo(() => {
        if (!value) {
            return '';
        }
        try {
            return Prism.highlight(value, Prism.languages.yaml, 'yaml');
        } catch {
            return value;
        }
    }, [value]);

    // Generate line numbers
    const lineNumbers = useMemo(() => {
        const lines = value.split('\n');
        return lines.map((_, i) => i + 1);
    }, [value]);

    // Sync scroll between textarea and pre
    const handleScroll = useCallback(() => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    const isDark = theme === 'dark';

    return (
        <div className={`prism-editor relative flex ${className}`} style={{ height }}>
            {/* Inject Prism styles */}
            <style>{isDark ? prismDarkStyles : prismLightStyles}</style>

            {/* Line Numbers */}
            <div
                className="flex-shrink-0 select-none text-right pr-3 py-4 overflow-hidden"
                style={{
                    color: isDark ? '#858585' : '#999999',
                    backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    minWidth: '50px',
                    borderRight: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                }}
            >
                {lineNumbers.map((num) => (
                    <div key={num} className="am-line-num">{num}</div>
                ))}
            </div>

            {/* Editor Container */}
            <div
                className="relative flex-1 overflow-hidden"
                style={{ backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }}
            >
                {/* Highlighted Code Display (background layer) */}
                <pre
                    ref={preRef}
                    className="absolute inset-0 m-0 p-4 overflow-auto pointer-events-none"
                    style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        color: isDark ? '#d4d4d4' : '#1e1e1e',
                        whiteSpace: 'pre',
                        wordWrap: 'normal',
                        backgroundColor: 'transparent',
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode || '&nbsp;' }}
                />

                {/* Transparent Textarea (foreground layer for editing) */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => !readonly && onChange(e.target.value)}
                    onScroll={handleScroll}
                    readOnly={readonly}
                    className="absolute inset-0 m-0 p-4 resize-none border-0 outline-none focus:ring-0"
                    style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        color: 'transparent',
                        caretColor: isDark ? '#d4d4d4' : '#1e1e1e',
                        backgroundColor: 'transparent',
                        whiteSpace: 'pre',
                        wordWrap: 'normal',
                        overflow: 'auto',
                    }}
                    spellCheck={false}
                    placeholder="Enter YAML configuration..."
                />
            </div>

            {/* Read-only Badge */}
            {readonly && (
                <div className="absolute top-2 right-2 z-10">
                    <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                            backgroundColor: isDark ? '#333' : '#e0e0e0',
                            color: isDark ? '#999' : '#666',
                        }}
                    >
                        Read-only
                    </span>
                </div>
            )}
        </div>
    );
}
