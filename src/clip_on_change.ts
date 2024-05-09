import { useState, useEffect } from 'react';
import { readText } from '@tauri-apps/plugin-clipboard-manager';

function useClipboardChange(callback: (text: string) => void) {
  const [clipboardContent, setClipboardContent] = useState('');

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const text = await readText();
        if (text !== clipboardContent) {
          setClipboardContent(text);
          callback(text);
        }
      } catch (error) {
        console.error('Failed to read from clipboard:', error);
      }
    }, 1000); // 检查剪贴板内容的频率为每秒一次

    return () => clearInterval(intervalId); // 清理 interval
  }, [clipboardContent, callback]);

  return clipboardContent;
}

export default useClipboardChange;
