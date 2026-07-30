import { useLocation, useNavigate } from "react-router-dom";


function Result(){

const navigate = useNavigate();

const location = useLocation();


const {
score = 0,
totalQuestions = 0,
category = "",
percentage = 0

} = location.state || {};





return (

<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">


<h1 className="text-3xl font-bold text-gray-800">

🎉 Interview Completed

</h1>



<h2 className="text-xl mt-6 font-bold">

Category:

</h2>

<p>

{category}

</p>




<h2 className="text-xl mt-5 font-bold">

Your Score

</h2>

<p className="text-4xl font-bold text-blue-600">

{score}/{totalQuestions}

</p>




<h2 className="text-xl mt-5 font-bold">

Percentage

</h2>

<p className="text-3xl font-bold text-green-600">

{percentage}%

</p>





<div className="mt-8 flex gap-4 justify-center">


<button

onClick={()=>navigate("/interview")}

className="bg-blue-600 text-white px-5 py-3 rounded"

>

Retry Interview

</button>




<button

onClick={()=>navigate("/dashboard")}

className="bg-gray-700 text-white px-5 py-3 rounded"

>

Dashboard

</button>



</div>



</div>


</div>

);


}


export default Result;