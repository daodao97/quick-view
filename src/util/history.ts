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

export const getHistory = async (type = 'json') : Promise<History[]> => {
    const db = await loadDatabase();
    const history = await db.select('SELECT * FROM history WHERE content_type = "' + type + '" ORDER BY id DESC');
    return history as History[];
}

export const addHistory = async (text: string, type: string = 'json') => {
    const db = await loadDatabase();
    await db.execute(`INSERT INTO history (content, content_type) VALUES ($1, $2)`, [text, type]);
}

export const clearHistory = async (type = 'json') => {
    const db = await loadDatabase();
    await db.execute('DELETE FROM history WHERE content_type = $1', [type]);
}


