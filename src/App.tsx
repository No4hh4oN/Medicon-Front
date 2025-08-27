
import Viewer from './pages/Viewer';

import DicomViewer from './components/DicomViewer';
import PacsPlusSearchMinimal from './components/SearchComponents';


export default function App() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Viewer />
        </div>
    );
}
