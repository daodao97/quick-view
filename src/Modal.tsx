import { History } from "./history";

function Modal({ onClose, historyRecords, onClick }: { onClose: () => void, historyRecords: History[], onClick?: (record: History) => void }) {

    // 处理点击外部关闭模态框的逻辑
    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.currentTarget === event.target) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center" onClick={handleBackdropClick}>
            <div className="relative bg-white p-4 rounded-lg shadow-lg w-4/5 max-w-4xl max-h-4/5 my-4 overflow-hidden">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-800 text-lg font-bold">
                    ×
                </button>
                <h2 className="font-bold text-lg mb-2">历史记录</h2>
                <ul className="max-h-80 overflow-y-auto">
                    {historyRecords.map((record, index) => (
                        <li key={index} className="border-b last:border-b-0 py-2" onClick={() => onClick?.(record)}>
                            {record.content}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Modal