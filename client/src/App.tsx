import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Routes, Route } from 'react-router-dom';
import BackgroundRemover from './components/BackgroundRemover';
 import { ToastContainer, toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css'

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
			</Routes>
			<Footer />
		</>
	);
}
export default App;