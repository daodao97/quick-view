import React, { useRef } from 'react';
import * as monaco from "monaco-editor";
import useMonacoEditor from './monaco'; // 确保 useMonacoEditor 钩子在同一目录下或正确的导入路径

type OnEditCallback = (newValue: string, oldValue: string) => void;

type MonacoEditorProps = {
    value: string,
    options?: monaco.editor.IStandaloneEditorConstructionOptions,
    onEdit?: OnEditCallback,
    style?: React.CSSProperties // 添加 style 类型
};

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, options = {}, onEdit, style }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useMonacoEditor(containerRef, value, options, onEdit);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', ...style }} /> // 应用 style
    );
};

export default MonacoEditor;
