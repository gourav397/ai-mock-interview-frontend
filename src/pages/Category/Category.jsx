import { useNavigate } from "react-router-dom";


function Category(){

const navigate = useNavigate();


const categories=[
"Haryana GK",
"General Knowledge",
"Reasoning",
"Current Affairs",
"Indian History",
"Indian Polity",
"Geography",
"Science",
"Computer",
"Python",
"Cyber Security",
"AI & Machine Learning",
"SSC",
"UPSC",
"Railway",
"Banking",
"Defence",
"Mathematics",
"Hindi",
"English",
"Haryana History",
"Haryana Geography",
"Haryana Polity",
"Haryana Economy",
"Haryana Culture & Heritage",
"Haryana Environment",
"Haryana Literature"
];



return(

<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-6xl mx-auto">


<h1 className="text-3xl font-bold">
Choose Category
</h1>



<div className="grid md:grid-cols-4 gap-5 mt-8">


{
categories.map((cat,index)=>(


<div

key={index}

className="bg-white p-6 rounded-xl shadow"


>


<h2 className="font-bold text-lg">

{cat}

</h2>



<p className="text-gray-500 mt-2">

100 Practice Questions

</p>



<button

onClick={()=>navigate(`/test/${cat}`)}

className="mt-4 bg-blue-600 text-white px-5 py-2 rounded"

>

Start Test

</button>



</div>


))

}



</div>


</div>


</div>


);


}


export default Category;