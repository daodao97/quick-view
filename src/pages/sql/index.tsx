import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useRef } from "react";
import { fetch } from '@tauri-apps/plugin-http';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import historySvg from "../../assets/history.svg";
import * as monaco from 'monaco-editor';
import Modal from "../../comps/Modal";
function App() {

    const [sql, setSql] = useState("");
    const [editor, setEditor] = useState();
    const container = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
        }
    };

    const options = {
        selectOnLineNumbers: true,
        minimap: {
            enabled: false
        }
    }

    const formatSQL = async (content: string) => {
        const response = await fetch("https://codebeautify.org/Ql/formateQL", {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6,la;q=0.5,fr;q=0.4,da;q=0.3,it;q=0.2",
                "content-type": "application/x-www-form-urlencoded",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://codebeautify.org/sqlformatter",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "data=" + encodeURIComponent(content),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        const text = await response.text();

        console.log('format ', text);
        console.log('format ', response.status);
        if (text != "") {
            setSql(text)
        }
    }

    async function initClipText() {
        const text = await readText();
        console.log(`Got text init, payload: ${text}`);
        if (text != sql) {
            setSql(text);
            await formatSQL(text);
        }
    }

    useEffect(() => {
        let _editor;
        if (container.current) {
            _editor = monaco.editor.create(container.current, {
                value: sql,
                language: 'sql',
                ...options
            });
        }

        setEditor(_editor);

        return () => {
            if (_editor) {
                _editor.dispose(); // 清理函数，用于销毁编辑器实例
            }
        };
    }, []); // 确保初始化只执行一次

    useEffect(() => {
        if (container.current) {
            const editor = monaco.editor.getModels()[0];
            editor.setValue(sql);
        }
    }, [sql]); // 当 sql 变化时，更新编辑器内容


    useEffect(() => {
        async function listenGet() {
            return await listen<string>('get_sql', async (event) => {
                console.log(`Got json, payload: ${event.payload}`);
                setSql(event.payload);
                await formatSQL(event.payload);
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
                <input type="text" className="flex-grow mr-2 p-2" placeholder="type keyword to filter" />
                <button onClick={toggleModal} className="p-2">
                    <img src={historySvg} className="h-5 w-5" alt="history" />
                </button>
            </div>
            {isModalOpen && <Modal onClose={toggleModal}>
                <div>xxxx</div>
            </Modal>}
        </div>
    );
}

export default App;