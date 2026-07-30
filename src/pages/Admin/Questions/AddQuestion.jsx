import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";


function AddQuestion(){

const navigate = useNavigate();


const [form,setForm]=useState({

exam:"",
category:"",
subject:"",
topic:"",
year:"",
question:"",
correctAnswer:""

});



const change=(e)=>{

setForm({

...form,

[e.target.name]:e.target.value

});

};




const submit=async(e)=>{

e.preventDefault();


try{


await API.post(
"/questions",
{

...form,

options:[

{
text:form.correctAnswer,
isCorrect:true,
explanation:"Correct Answer"
},

{
text:"Option B",
isCorrect:false,
explanation:"Wrong Option"
},

{
text:"Option C",
isCorrect:false,
explanation:"Wrong Option"
},

{
text:"Option D",
isCorrect:false,
explanation:"Wrong Option"
}

],

explanation:"Important exam question"

}

);



alert("Question Added");


navigate("/admin/questions");


}
catch(error){

console.log(error);

alert("Failed");

}


};





return(

<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">


<h1 className="text-3xl font-bold">

Add Question

</h1>



<form onSubmit={submit} className="space-y-4 mt-6">


{

[
"exam",
"category",
"subject",
"topic",
"year",
"question",
"correctAnswer"

].map((item)=>(


<input

key={item}

name={item}

placeholder={item}

onChange={change}

className="w-full border p-3 rounded"

/>


))


}



<button

className="bg-green-600 text-white px-6 py-3 rounded"

>

Save Question

</button>



</form>



</div>


</div>

);


}


export default AddQuestion;