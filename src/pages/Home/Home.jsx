import { useNavigate } from "react-router-dom";


function Home() {

  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-gray-50">

      <section className="flex flex-col items-center justify-center text-center px-6 py-20">

        <h1 className="text-5xl font-bold text-gray-900">
          Crack Your Next Interview
          <span className="text-blue-600"> With AI</span>
        </h1>


        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
          Practice real interview questions, get AI-powered feedback,
          and improve your skills with our smart interview assistant.
        </p>


        <div className="mt-8 flex gap-4">

          <button
onClick={()=>{
const token = localStorage.getItem("token");

if(token){
navigate("/interview");
}
else{
navigate("/login");
}
}}
className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
>

Start Interview

</button>


          <button className="border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-100">

            Learn More

          </button>

        </div>

      </section>


      {/* Features same rahega */}

    </div>
  );
}


export default Home;