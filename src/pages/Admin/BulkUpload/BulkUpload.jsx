import { useState } from "react";
import API from "../../../services/api";


function BulkUpload(){

const [file,setFile] = useState(null);


const upload = async()=>{


if(!file){

alert("Select JSON file");

return;

}


try{


const text = await file.text();


const questions = JSON.parse(text);



const res = await API.post(
"/admin/questions/upload",
questions
);



alert(
`Upload Complete: ${res.data.total} Questions Added`
);


setFile(null);


}
catch(error){

console.log(error);

alert("Upload Failed");

}


};



return(

<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">


<h1 className="text-3xl font-bold">

Bulk Upload Questions 📤

</h1>



<input

type="file"

accept=".json"

className="mt-6 border p-3"

onChange={
e=>setFile(e.target.files[0])
}

/>



<button

onClick={upload}

className="mt-5 bg-blue-600 text-white px-6 py-3 rounded"

>

Upload Questions

</button>



</div>


</div>


);


}


export default BulkUpload;