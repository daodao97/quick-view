import { useEffect, useState } from "react";
import { getCurrent } from '@tauri-apps/api/window';
import ReactJson from 'react-json-view'
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import historySvg from "../../assets/history.svg";
import editorSvg from "../../assets/editor.svg";
import { get } from "lodash";
import Modal from "../../comps/Modal";
import { addHistory, getHistory } from '../../util/history';
import { History } from "../../util/history";
import { listen } from '@tauri-apps/api/event';
import { isJsonText } from "./funcs";
import HistoryTable from "../../comps/history_table";
import MonacoEditor from "../../comps/MonacoEditor";

function App() {
  const [isJson, setIsJson] = useState(false);
  const [content, setContent] = useState({});
  const [userCopy, setUserCopy] = useState('');
  const [path, setPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<History[]>([]);
  const [editorContent, setEditorContent] = useState(undefined);

  const [editorMod, setEditorMod] = useState(false);

  const onEditorChange = async (newVal: string) => {
    console.log(newVal.trim())
    const data = await isJsonText(newVal.trim());
    if (data) {
      // todo editor 会失去焦点
      // setEditorContent(data);
    }
  }

  const toggleMditorMod = () => {
    setEditorMod(!editorMod);
    if (!editorMod && editorContent) {
      setContent(editorContent);
    }

    if (editorMod) {
      setEditorContent(editorContent);
    }
  }

  const receivedJson = async (text: string) => {
    if (text === userCopy) return
    const data = await isJsonText(text);
    if (data) {
      setContent(data);
      setIsJson(true);
      await getCurrent().setFocus();
      await addHistory(text);
      setIsModalOpen(false);
      setEditorMod(false);
    }
  };

  const enableClipboard = async () => {
    const text = await readText();
    setUserCopy(text);
  }

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      loadHistory();
    }
  };

  async function loadHistory() {
    const records = await getHistory();
    records && setHistory(records);
  }

  useEffect(() => {
    loadHistory();

    async function listenGet() {
      await listen<string>('get_json', async (event) => {
        console.log(`Got json, payload: ${event.payload}`);
        await receivedJson(event.payload);
      });
    }

    listenGet();

    async function initClipText() {
      const text = await readText();
      console.log(`Got text init, payload: ${text}`);
      if (text != content) {
        receivedJson(text);
      }
    }

    initClipText();
  }, []);

  const onHistoryClick = async (record: History) => {
    const text = record.content;
    const data = await isJsonText(text);
    if (data) {
      setContent(data);
      setIsJson(true);
      setIsModalOpen(false);
    }
  };

  const options = {
    language: "json",
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="flex-grow p-1 pb-20">
        <div style={{display: editorMod ? 'block' : 'none' }}>
          <MonacoEditor value={JSON.stringify(content, null, 2)} options={options} onEdit={onEditorChange}  style={{ height: '90vh', paddingTop: '1vh' }}></MonacoEditor>
        </div>
        {!editorMod &&
          <ReactJson
            src={isJson ? (path ? { [path]: get(content, path, undefined) } : content) : {}}
            name={false}
            enableClipboard={enableClipboard}
            displayDataTypes={false}
          />
        }
      </div>
      <div className="flex items-center justify-between bg-gray-200 p-2 shadow-inner fixed inset-x-0 bottom-0 h-15">
        <input type="text" className="flex-grow mr-2 p-2" placeholder="type a[0].b.c to filter" value={path} onChange={(e) => setPath(e.target.value)} />
        <button onClick={toggleMditorMod} className="p-2">
          <img src={editorSvg} className="h-5 w-5" alt="editor" />
        </button>
        <button onClick={toggleModal} className="p-2">
          <img src={historySvg} className="h-5 w-5" alt="history" />
        </button>
      </div>
      {isModalOpen && <Modal onClose={toggleModal}>
        <HistoryTable historyRecords={history} onClick={onHistoryClick}></HistoryTable>
      </Modal>}
    </div>
  );
}

export default App;
