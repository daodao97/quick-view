import Database from '@tauri-apps/plugin-sql';

export type History = {
    id: number;
    content: string;
}

export const getHistory = async () : Promise<History[]> => {
    const db = await Database.load('sqlite:mydatabase.db');
    const history = await db.select('SELECT * FROM history ORDER BY id DESC');
    return history as History[];
}

export const addHistory = async (text: string) => {
    const db = await Database.load('sqlite:mydatabase.db');
    await db.execute(`INSERT INTO history (content) VALUES ($1)`, [text]);
}

export const clearHistory = async () => {
    const db = await Database.load('sqlite:mydatabase.db');
    await db.execute('DELETE FROM history');
}