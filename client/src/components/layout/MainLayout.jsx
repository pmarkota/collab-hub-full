import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default MainLayout;
