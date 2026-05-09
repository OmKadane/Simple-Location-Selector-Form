import LocationSelector from "./LocationSelector";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <LocationSelector onConfirm={(loc) => alert(`Confirmed: ${loc.country} → ${loc.city}`)} />
    </div>
  );
}

export default App;
