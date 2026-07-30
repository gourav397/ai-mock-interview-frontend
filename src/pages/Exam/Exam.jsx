import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";


function Exam(){

  const navigate = useNavigate();


  const [exams,setExams] = useState([]);

  const [loading,setLoading] = useState(true);



  useEffect(()=>{


    const getExams = async()=>{


      try{


        const res = await API.get("/questions");


        console.log("QUESTIONS:",res.data);



        const examList = [
          ...new Set(
            res.data.map(
              item => item.exam
            )
          )
        ];



        setExams(examList);


      }
      catch(error){

        console.log(error);

      }
      finally{

        setLoading(false);

      }


    };



    getExams();



  },[]);






  return(


    <div className="min-h-screen bg-gray-100 p-8">


      <div className="max-w-5xl mx-auto">


        <h1 className="text-3xl font-bold">
          Choose Your Exam
        </h1>



        {
          loading &&

          <p className="mt-5">
            Loading Exams...
          </p>

        }



        <div className="grid md:grid-cols-3 gap-5 mt-8">


        {
          exams.map((exam,index)=>(


            <div

            key={index}

            className="bg-white p-6 rounded-xl shadow"


            >


              <h2 className="text-xl font-bold">
                {exam}
              </h2>



              <p className="text-gray-500 mt-2">
                Previous Year Important Questions
              </p>



              <button

              onClick={()=>navigate(`/test/${exam}`)}

              className="mt-5 bg-blue-600 text-white px-5 py-2 rounded"

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


export default Exam;