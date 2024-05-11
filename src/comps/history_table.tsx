import { History } from "../util/history";
type HistoryTableProps = {
    historyRecords: History[];
    onClick?: (record: History) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ historyRecords, onClick }) => {
    return (
        <table className="w-full max-h-80 overflow-y-auto border-collapse">
            <thead>
                <tr>
                    <th className="border-b-2 text-left">ID</th>
                    <th className="border-b-2 text-left">Content</th>
                    <th className="border-b-2 text-left">Copyed At</th>
                </tr>
            </thead>
            <tbody>
                {historyRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-100 cursor-pointer" onClick={() => onClick?.(record)} style={{ height: '50px' }}>
                        <td className="border-b p-2 truncate">{record.id}</td>
                        <td className="border-b p-2 truncate">{record.content}</td>
                        <td className="border-b p-2 truncate">{record.created_at.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default HistoryTable