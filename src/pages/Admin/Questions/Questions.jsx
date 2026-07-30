import { useEffect, useState } from "react";
import API from "../../../services/api";


function Questions(){


const [questions,setQuestions] = useState([]);

const [loading,setLoading] = useState(true);

const [search,setSearch] = useState("");




const fetchQuestions = async()=>{


try{


const res = await API.get(
`/questions?search=${search}`
);



setQuestions(
res.data.questions || []
);



}
catch(error){

console.log(error);

alert("Questions load nahi ho rahe");

}
finally{

setLoading(false);

}


};





useEffect(()=>{


fetchQuestions();


},[search]);






const deleteQuestion = async(id)=>{


try{


await API.delete(
`/questions/${id}`
);



alert("Question Deleted");


fetchQuestions();



}
catch(error){


console.log(error);

alert("Delete failed");


}



};






return(


<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow">



<div className="flex justify-between items-center">


<h1 className="text-3xl font-bold">

Question Bank 📝

</h1>



<button

className="bg-blue-600 text-white px-5 py-2 rounded"

>

Add Question

</button>


</div>





<input

type="text"

placeholder="Search Question..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="mt-6 w-full border p-3 rounded"

/>





{

loading ?

<h2 className="mt-8">

Loading...

</h2>


:

<div className="mt-8 space-y-5">


{

questions.map((q)=>(


<div

key={q._id}

className="border rounded-xl p-5"

>



<div className="flex justify-between">


<h2 className="font-bold">

{q.exam}

</h2>



<button

onClick={()=>deleteQuestion(q._id)}

className="bg-red-600 text-white px-4 py-1 rounded"

>

Delete

</button>


</div>





<p className="mt-3 font-semibold">

{q.question}

</p>




<p className="text-gray-500 mt-2">

Category: {q.category}

</p>



<p className="text-gray-500">

Year: {q.year}

</p>



</div>



))


}



</div>


}



</div>


</div>


);


}


export default Questions;