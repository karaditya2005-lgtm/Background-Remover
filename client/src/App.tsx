import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Routes, Route } from 'react-router-dom';
import BackgroundRemover from './components/BackgroundRemover';
 import { ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css'
import ImageHistory from './components/ImageHistory';
import VideoDemo from './components/VideoDemo';

function App() {
	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			<ToastContainer position='top-right' />
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/bg-remover" element={<BackgroundRemover />} />
				<Route path="/img-history" element={<ImageHistory />} />
				<Route path="/vid-demo" element={<VideoDemo />} />
			</Routes>
			<Footer />
		</>
	);
}
export default App;