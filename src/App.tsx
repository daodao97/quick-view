import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";

import Json from "./pages/json";
import Clip from "./pages/clip";
 
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Json />} />
                <Route path="/clip" element={<Clip />} />
            </Routes>
        </Router>
    );
}
 
export default App;