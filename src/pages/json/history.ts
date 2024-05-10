import Database from '@tauri-apps/plugin-sql';

export type History = {
    id: number;
    content: string;
    content_type: string;
    created_at: Date;
}

const loadDatabase = async () => {
    return await Database.load('sqlite:quick_view.db');
}

export const getHistory = async () : Promise<History[]> => {
    const db = await loadDatabase();
    const history = await db.select('SELECT * FROM history ORDER BY id DESC');
    return history as History[];
}

export const addHistory = async (text: string) => {
    const db = await loadDatabase();
    await db.execute(`INSERT INTO history (content) VALUES ($1)`, [text]);
}

export const clearHistory = async () => {
    const db = await loadDatabase();
    await db.execute('DELETE FROM history');
}


