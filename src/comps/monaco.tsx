import { useEffect, useRef } from 'react';
import { editor, languages } from 'monaco-editor';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

type OnEditCallback = (newValue: string, oldValue: string) => void;

function useMonacoEditor(
    containerRef: React.RefObject<HTMLDivElement>,
    value: string,
    options: monaco.editor.IStandaloneEditorConstructionOptions = {},
    onEdit?: OnEditCallback
): monaco.editor.IStandaloneCodeEditor | null {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    // const contentRef = useRef(value);
    useEffect(() => {
        // 确保编辑器只在 container 存在且尚未初始化时创建
        if (containerRef.current && !editorRef.current) {
            editorRef.current = editor.create(containerRef.current, {
                value: value + "\n".repeat(100),
                minimap: { enabled: false },
                ...options,
            });

            languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
            });

            // 监听编辑器内容变化事件
            const model = editorRef.current.getModel();
            let previousValue = value;
            model?.onDidChangeContent(() => {
                const currentValue = model.getValue();
                if (onEdit && previousValue !== currentValue) {
                    onEdit(currentValue, previousValue);
                    previousValue = currentValue;
                }
            });
        }

        // 定义响应窗口大小变化的函数
        const handleResize = () => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        };

        // 添加窗口大小变化监听器
        window.addEventListener('resize', handleResize);

        // 清理函数
        return () => {
            window.removeEventListener('resize', handleResize);
            if (editorRef.current) {
                editorRef.current.dispose();
                editorRef.current = null;
            }
        };

    }, [containerRef, options]);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setValue(value + "\n".repeat(100));
        }
    }, [value]);

    return editorRef.current;
}

export default useMonacoEditor;