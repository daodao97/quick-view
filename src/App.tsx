import { useEffect, useState } from "react";
import "./App.css";
import onChange from "./clip_on_change";
import { checkClipboardForJson } from "./json";
import { getCurrent } from '@tauri-apps/api/window';
import ReactJson from 'react-json-view'
import { readText } from '@tauri-apps/plugin-clipboard-manager';

function App() {
  const [isJson, setIsJson] = useState(false);
  const [content, setContent] = useState({});
  const [userCopy, setUserCopy] = useState('');


  onChange(async (text) => {
    if (text === userCopy) return
    const data = await checkClipboardForJson(text);
    if (data) {
      setContent(data);
      setIsJson(true);
      await getCurrent().setFocus();
    } else {
      setIsJson(false);
    }
  })

  const enableClipboard = async (copyed: any) => {
    const text = await readText();
    setUserCopy(text);
  }

  return (
    <div className="container">
      <ReactJson src={ isJson ? content : {}} name={false} enableClipboard={enableClipboard}></ReactJson>
    </div>
  );
}

export default App;
