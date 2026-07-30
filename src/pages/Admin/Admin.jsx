import { useNavigate } from "react-router-dom";


function Admin(){


const navigate = useNavigate();


const user = JSON.parse(
localStorage.getItem("user")
);



const logout = ()=>{

localStorage.removeItem("token");

localStorage.removeItem("user");

navigate("/login");

};




return(


<div className="min-h-screen bg-gray-100 p-8">


<div className="max-w-5xl mx-auto">



<div className="bg-white rounded-xl shadow p-8">



<h1 className="text-3xl font-bold">

Admin Dashboard 👨‍💼

</h1>



<p className="text-gray-500 mt-2">

Welcome {user?.name || "Admin"}

</p>





<div className="grid md:grid-cols-3 gap-5 mt-8">
<div className="border rounded-xl p-5">

<h2 className="text-xl font-bold">
📤 Bulk Upload
</h2>


<p className="text-gray-500 mt-2">
Upload multiple questions at once
</p>


<button

className="mt-4 bg-orange-600 text-white px-5 py-2 rounded"

onClick={()=>navigate("/admin/bulk-upload")}

>

Upload

</button>


</div>





<div className="border rounded-xl p-5">

<h2 className="text-xl font-bold">

📝 Questions

</h2>


<p className="text-gray-500 mt-2">

Manage exam questions

</p>



<button

className="mt-4 bg-blue-600 text-white px-5 py-2 rounded"

onClick={()=>navigate("/admin/questions")}

>

Manage

</button>


</div>







<div className="border rounded-xl p-5">


<h2 className="text-xl font-bold">

👥 Users

</h2>



<p className="text-gray-500 mt-2">

View registered users

</p>



<button

className="mt-4 bg-green-600 text-white px-5 py-2 rounded"

>

View

</button>



</div>







<div className="border rounded-xl p-5">


<h2 className="text-xl font-bold">

📊 Analytics

</h2>


<p className="text-gray-500 mt-2">

Test performance data

</p>



<button

className="mt-4 bg-purple-600 text-white px-5 py-2 rounded"

>

View

</button>



</div>





</div>





<button

onClick={logout}

className="mt-8 bg-red-600 text-white px-6 py-2 rounded"

>

Logout

</button>





</div>


</div>


</div>


);


}



export default Admin;