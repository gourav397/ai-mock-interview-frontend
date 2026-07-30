import { Link, useNavigate } from "react-router-dom";

function Navbar() {

  const navigate = useNavigate();

  const token = localStorage.getItem("token");


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">

      <Link
        to="/"
        className="text-2xl font-bold text-blue-600"
      >
        AI Interview
      </Link>


      <div className="flex gap-6 items-center">


        <Link
          to="/"
          className="text-gray-700 hover:text-blue-600"
        >
          Home
        </Link>


        {token ? (
          <>

            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-blue-600"
            >
              Dashboard
            </Link>


            <Link
              to="/profile"
              className="text-gray-700 hover:text-blue-600"
            >
              Profile
            </Link>


            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>

          </>
        ) : (
          <>

            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>


            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Register
            </Link>

          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;