import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { fetch } from '@tauri-apps/plugin-http';
import MonacoEditor from 'react-monaco-editor'
import { readText } from '@tauri-apps/plugin-clipboard-manager';
function App() {

    const [sql, setSql] = useState("");

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
        if (text != "") setSql(text);
    }

    // async function initClipText() {
    //     const text = await readText();
    //     console.log(`Got text init, payload: ${text}`);
    //     if (text != sql) {
    //         setSql(text);
    //         await formatSQL(text);
    //     }
    // }

    // initClipText();

    useEffect(() => {
        async function listenGet() {
            await listen<string>('get_sql', async (event) => {
                console.log(`Got json, payload: ${event.payload}`);
                setSql(event.payload);
                await formatSQL(event.payload);
            });
        }

        listenGet();
    })


    return (
        <div>
            <MonacoEditor
                width='100%'
                height='100%'
                language='sql'
                theme='vs-dark'
                value={sql}
                options={options}
            />
        </div>
    );
}

export default App;