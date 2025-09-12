import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#f0f0f0" }}>
      <Link to="/signup" style={{ margin: "0 10px" }}>Signup</Link>
      <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
      <Link to="/profile" style={{ margin: "0 10px" }}>Profile</Link>
    </nav>
  );
}

export default Navbar;
