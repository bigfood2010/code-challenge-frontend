import CurrencySwapForm from "@/components/organisms/currency-swap-form";
import { ParallaxBackground } from "@/components/atoms/ParallaxBackground/ParallaxBackground";

function App() {
  return (
    <main className="app-shell">
      <ParallaxBackground />
      <CurrencySwapForm />
    </main>
  );
}

export default App;
