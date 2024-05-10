import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";

import Json from "./pages/json";
import Clip from "./pages/clip";
import SQL from "./pages/sql";
 
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Json />} />
                <Route path="/json" element={<Json />} />
                <Route path="/sql" element={<SQL />} />
                <Route path="/clip" element={<Clip />} />
            </Routes>
        </Router>
    );
}
 
export default App;