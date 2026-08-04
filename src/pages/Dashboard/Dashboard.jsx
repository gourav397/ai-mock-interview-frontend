import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../services/api";

function Dashboard() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [results,setResults] = useState([]);

  const totalInterviews = results.length;


const bestScore = results.length > 0
?
Math.max(...results.map(r=>r.percentage))
:
0;


const averagePercentage = results.length > 0
?
(
results.reduce(
(sum,r)=>sum + r.percentage,
0
) / results.length
).toFixed(2)
:
0;


useEffect(()=>{

const loadResults = async()=>{

try{

if(user?.id){

const res = await API.get(`/results/${user.id}`);

setResults(res.data);

}

}
catch(error){

console.log("RESULT HISTORY ERROR",error);

}

};


loadResults();


},[]);


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.name || "User"} 👋
        </h1>


        <p className="text-gray-500 mt-2">
          AI Mock Interview Dashboard
        </p>


        <div className="mt-8 grid md:grid-cols-3 gap-5">

          <div className="p-5 border rounded-xl">

<h2 className="font-bold text-xl">
📝 Practice Test
</h2>

<p className="text-gray-500 mt-2">
Choose category and practice questions
</p>


<button

onClick={()=>navigate("/category")}

className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"

>

Start Test

</button>


</div>


          <div className="p-5 border rounded-xl">
            <h2 className="font-bold text-xl">
              🎯 Start Interview
            </h2>

            <p className="text-gray-500 mt-2">
              Practice AI based interviews
            </p>

            <button
              onClick={() => navigate("/interview")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Start
            </button>

          </div>

          <div className="p-5 border rounded-xl">

<h2 className="font-bold text-xl">
📄 Upload Resume
</h2>

<p className="text-gray-500 mt-2">
Upload your Resume for AI Interview
</p>

<button
onClick={() => navigate("/upload-resume")}
className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
>
Upload Resume
</button>

</div>



          <div className="p-5 border rounded-xl">

            <h2 className="font-bold text-xl">
              👤 Profile
            </h2>

            <p className="text-gray-500 mt-2">
              View your profile
            </p>

            <button
              onClick={() => navigate("/profile")}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Profile
            </button>

          </div>



          <div className="p-5 border rounded-xl">

            <h2 className="font-bold text-xl">
              📧 Email
            </h2>

            <p className="text-gray-500 mt-2">
              {user?.email}
            </p>

          </div>

          <div className="p-5 border rounded-xl">

<h2 className="font-bold text-xl">
📊 Performance Stats
</h2>


<p className="mt-2">
<b>Name:</b> {user?.name}
</p>


<p>
<b>Total Interviews:</b> {totalInterviews}
</p>


<p>
<b>Best Score:</b> {bestScore}%
</p>


<p>
<b>Average Percentage:</b> {averagePercentage}%
</p>


</div>


        </div>


        <button
          onClick={logout}
          className="mt-8 bg-red-600 text-white px-5 py-2 rounded-lg"
        >
          Logout
        </button>
<div className="mt-8">

<h2 className="text-2xl font-bold">
📊 Interview History
</h2>


{
results.length === 0 ?

<p className="text-gray-500 mt-3">
No interviews attempted yet
</p>

:

<div className="mt-4 space-y-3">

{
results.map((result,index)=>(

<div
key={index}
className="border rounded-lg p-4"
>


<p>
<b>Category:</b> {result.category}
</p>


<p>
<b>Difficulty:</b> {result.difficulty}
</p>


<p>
<b>Score:</b> {result.score}/{result.totalQuestions}
</p>


<p>
<b>Percentage:</b> {result.percentage}%
</p>


<p>
<b>Correct Questions:</b> {result.correctQuestions}
</p>

<p>
<b>Wrong Questions:</b> {result.wrongQuestions}
</p>

<p>
<b>Performance:</b> {result.performance}
</p>

<p>
<b>Date:</b> 
{new Date(result.createdAt).toLocaleDateString()}
</p>


</div>

))
}

</div>

}


</div>

      </div>

    </div>
  );
}


export default Dashboard; 