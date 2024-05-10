import { useEffect, useState } from "react";
import { getCurrent } from '@tauri-apps/api/window';
import ReactJson from 'react-json-view'
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import historySvg from "../../assets/history.svg";
import { get } from "lodash";
import Modal from "../../comps/Modal";
import { addHistory, getHistory } from './history';
import { History } from "./history";
import { listen } from '@tauri-apps/api/event';
import { isJsonText } from "./funcs";

function App() {
  const [isJson, setIsJson] = useState(false);
  const [content, setContent] = useState({});
  const [userCopy, setUserCopy] = useState('');
  const [path, setPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<History[]>([]);

  const receivedJson = async (text : string) => {
    if (text === userCopy) return
    const data = await isJsonText(text);
    if (data) {
      setContent(data);
      setIsJson(true);
      await getCurrent().setFocus();
      await addHistory(text);
      setIsModalOpen(false);
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
    const records= await getHistory();
    records && setHistory(records);
  }

  useEffect(() => {
    loadHistory();

    async function listenError() {
      await listen<string>('get_json', async (event) => {
        console.log(`Got json, payload: ${event.payload}`);
        await receivedJson(event.payload);
      });
    }

    listenError();

    async function  initClipText() {
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

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="flex-grow p-4 pb-20">
        <ReactJson src={isJson ? (path ? { [path]: get(content, path, undefined) } : content) : {}} name={false} enableClipboard={enableClipboard} />
      </div>
      <div className="flex items-center justify-between bg-gray-200 p-2 shadow-inner fixed inset-x-0 bottom-0 h-15">
        <input type="text" className="flex-grow mr-2 p-2" placeholder="type a[0].b.c to filter" value={path} onChange={(e) => setPath(e.target.value)} />
        <button onClick={toggleModal} className="p-2">
          <img src={historySvg} className="h-5 w-5" alt="历史记录" />
        </button>
      </div>
      {isModalOpen && <Modal onClose={toggleModal} historyRecords={history} onClick={onHistoryClick} />}
    </div>
  );
}

export default App;
