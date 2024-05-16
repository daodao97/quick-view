import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useRef } from "react";
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import historySvg from "../../assets/history.svg";
import Modal from "../../comps/Modal";
import { History, getHistory, addHistory } from "../../util/history";
import HistoryTable from "../../comps/history_table";
// @ts-ignore
import sqlFormatter from 'sql-formatter-plus'
import { replaceSpaces, decodeUnicode } from './func'

import useMonacoEditor from "../../comps/monaco";

function App() {

    const [sql, setSql] = useState("");
    const container = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formating, setFormating] = useState(false);
    const [mining, setMining] = useState(false);
    const [history, setHistory] = useState<History[]>([]);

    useMonacoEditor(container, sql, {
        language: 'sql',
        selectOnLineNumbers: true,
        minimap: {
            enabled: false
        }
    });

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            loadHistory();
        }
    };

    async function loadHistory() {
        const records = await getHistory('sql');
        console.log(records)
        records && setHistory(records);
    }

    const formatSQL = (content: string) => {
        setFormating(true);

        content = decodeUnicode(content);
        try {
            const text = sqlFormatter.format(content);
            console.log('format', text)
            if (text != "") {
                setSql(text)
            }
        } catch (error) {
            console.log(error)
        }

        setFormating(false);
    }

    const miniSQL = (content: string) => {
        setMining(true);
        const text = replaceSpaces(content.replace(/\n/g, " "));
        if (text != "") {
            setSql(text)
        }

        setMining(false);
    }

    async function initClipText() {
        const text = await readText();
        console.log(`Got text init, payload: ${text}`);
        if (text != sql) {
            setSql(text);
            formatSQL(text);
        }
    }

    const onHistoryClick = async (record: History) => {
        const text = record.content;
        setSql(text);
        setIsModalOpen(false);
    };

    useEffect(() => {
        async function listenGet() {
            return await listen<string>('get_sql', async (event) => {
                console.log(`Got json, payload: ${event.payload}`);
                setSql(event.payload);
                addHistory(event.payload, 'sql');
                setIsModalOpen(false);
                formatSQL(event.payload);
            });
        }

        listenGet();
        initClipText();

    }, []); // 依赖数组为空，确保只执行一次

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div className="flex-grow pt-1 pb-20">
                <div id="container" ref={container} style={{ height: '100vh' }}></div>
            </div>
            <div className="flex items-center justify-between bg-gray-200 p-2 shadow-inner fixed inset-x-0 bottom-0 h-15">
                <div className="flex gap-3 justify-start">

                    <button disabled={formating}
                        onClick={() => formatSQL(sql)}
                        className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-2 px-4 rounded-lg bg-white text-blue-gray-900 shadow-md shadow-blue-gray-500/10 hover:shadow-lg hover:shadow-blue-gray-500/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none flex items-center gap-3"
                        type="button">
                        {
                            formating
                                ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                : undefined
                        }
                        Format SQL
                    </button>
                    <button
                        disabled={mining}
                        onClick={() => { miniSQL(sql) }}
                        className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-2 px-4 rounded-lg bg-white text-blue-gray-900 shadow-md shadow-blue-gray-500/10 hover:shadow-lg hover:shadow-blue-gray-500/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none flex items-center gap-3"
                        type="button">
                        {
                            mining
                                ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                : undefined
                        }
                        Mini SQL
                    </button>
                    <div></div>
                </div>
                <button onClick={toggleModal} className="p-2">
                    <img src={historySvg} className="h-5 w-5" alt="history" />
                </button>
            </div>
            {isModalOpen && <Modal onClose={toggleModal}>
                {isModalOpen && <Modal onClose={toggleModal}>
                    <HistoryTable historyRecords={history} onClick={onHistoryClick}></HistoryTable>
                </Modal>}
            </Modal>}
        </div>
    );
}

export default App;