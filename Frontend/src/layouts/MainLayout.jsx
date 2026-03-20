import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

function MainLayout({ children }) {

  return (
    <>
      <Navbar />

      <main>
        {children}
      </main>

      <Footer />
       <BottomNav />
    </>
  );

}

export default MainLayout;