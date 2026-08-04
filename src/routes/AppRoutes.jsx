import { Routes, Route } from "react-router-dom";


// Pages
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import Dashboard from "../pages/Dashboard/Dashboard";
import Profile from "../pages/Profile/Profile";

import Interview from "../pages/Interview/Interview";

import Exam from "../pages/Exam/Exam";
import Test from "../pages/Test/Test";
import Result from "../pages/Result";

import UploadResume from "../pages/UploadResume";

// Admin Pages
import Admin from "../pages/Admin/Admin";
import Questions from "../pages/Admin/Questions/Questions";
import BulkUpload from "../pages/Admin/BulkUpload/BulkUpload";
import Category from "../pages/Category/Category";


function AppRoutes(){


  return (

    <Routes>


      {/* Public */}

      <Route
        path="/"
        element={<Home />}
      />


      <Route
        path="/login"
        element={<Login />}
      />


      <Route
        path="/register"
        element={<Register />}
      />




      {/* Student */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />


      <Route
        path="/profile"
        element={<Profile />}
      />

      <Route
        path="/upload-resume"
        element={<UploadResume />}
      />



      <Route
       path="/category"
       element={<Category />}
      />

      <Route
        path="/interview"
        element={<Interview />}
      />


      <Route
        path="/exam"
        element={<Exam />}
      />


      <Route
        path="/test/:category"
        element={<Test />}
      />

      <Route
        path="/result"
        element={<Result />}
/>





      {/* Admin */}

      <Route
        path="/admin"
        element={<Admin />}
      />


      <Route
        path="/admin/questions"
        element={<Questions />}
      />

      <Route
       path="/admin/bulk-upload"
       element={<BulkUpload />}
      />



    </Routes>

  );

}


export default AppRoutes;