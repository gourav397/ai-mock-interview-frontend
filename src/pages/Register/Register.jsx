import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

function Register() {

  const navigate = useNavigate();


  const [formData,setFormData] = useState({

    name:"",
    email:"",
    password:""

  });


  const [otp,setOtp] = useState("");

  const [otpSent,setOtpSent] = useState(false);

  const [verified,setVerified] = useState(false);

  const [loading,setLoading] = useState(false);



  const handleChange=(e)=>{

    setFormData({

      ...formData,

      [e.target.name]:e.target.value

    });

  };





  // SEND OTP

  const sendOTP = async()=>{


    try{


      setLoading(true);


      const res = await API.post(

        "/auth/send-otp",

        {
          email:formData.email
        }

      );


      alert(res.data.message);

      setOtpSent(true);



    }
    catch(error){


      alert(

        error.response?.data?.message ||
        "OTP Send Failed"

      );


    }
    finally{

      setLoading(false);

    }


  };








  // VERIFY OTP

  const verifyOTP = async()=>{


    try{


      const res = await API.post(

        "/auth/verify-otp",

        {

          email:formData.email,

          otp

        }

      );



      alert(res.data.message);


      setVerified(true);



    }
    catch(error){


      alert(

        error.response?.data?.message ||
        "OTP Verification Failed"

      );


    }


  };









  // CREATE ACCOUNT

  const handleSubmit=async(e)=>{


    e.preventDefault();


    if(!verified){

      return alert(
        "Please verify email first"
      );

    }


  console.log("FORM DATA SEND:", formData);

    try{


      setLoading(true);



      const res = await API.post(

        "/auth/signup",

        formData

      );



      alert(res.data.message);



      navigate("/login");



    }
    catch(error){


      alert(

        error.response?.data?.message ||
        "Registration Failed"

      );


    }
    finally{

      setLoading(false);

    }



  };





return(

<div className="min-h-screen flex items-center justify-center bg-gray-100">


<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">


<h1 className="text-3xl font-bold text-center">

Create Account

</h1>



<p className="text-center text-gray-500 mt-2">

Verify email to continue

</p>





<form 
onSubmit={handleSubmit}
className="mt-8 space-y-4"
>




<input

type="text"

name="name"

placeholder="Full Name"

value={formData.name}

onChange={handleChange}

required

className="w-full px-4 py-3 border rounded-lg"

/>





<div className="flex gap-2">


<input

type="email"

name="email"

placeholder="Email Address"

value={formData.email}

onChange={handleChange}

required

disabled={verified}

className="flex-1 px-4 py-3 border rounded-lg"

/>




<button

type="button"

onClick={sendOTP}

disabled={otpSent}

className="bg-green-600 text-white px-3 rounded-lg"

>

{
otpSent ?
"Sent":
"OTP"
}

</button>


</div>







{
otpSent && !verified && (

<div className="flex gap-2">


<input

type="text"

placeholder="Enter OTP"

value={otp}

onChange={(e)=>setOtp(e.target.value)}

className="flex-1 px-4 py-3 border rounded-lg"

/>


<button

type="button"

onClick={verifyOTP}

className="bg-blue-600 text-white px-3 rounded-lg"

>

Verify

</button>


</div>


)

}





<input

type="password"

name="password"

placeholder="Password"

value={formData.password}

onChange={handleChange}

required

className="w-full px-4 py-3 border rounded-lg"

/>





<button

type="submit"

disabled={loading}

className="w-full bg-blue-600 text-white py-3 rounded-lg"

>

{

loading ?

"Creating..." :

"Create Account"

}


</button>




</form>


</div>


</div>


);


}


export default Register;