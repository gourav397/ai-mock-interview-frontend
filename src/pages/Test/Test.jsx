import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";


function Test(){

  const { exam } = useParams();

  const navigate = useNavigate();


  const [questions,setQuestions] = useState([]);
  const [current,setCurrent] = useState(0);
  const [selected,setSelected] = useState("");
  const [showResult,setShowResult] = useState(false);
  const [score,setScore] = useState(0);
  const [loading,setLoading] = useState(true);



  useEffect(()=>{


    const fetchQuestions = async()=>{


      try{


        const res = await API.get(
           `/questions?category=${exam}`
        );


        setQuestions(res.data);


      }
      catch(error){

        console.log(error);

        alert("Questions load nahi hue");

      }
      finally{

        setLoading(false);

      }


    };


    fetchQuestions();


  },[exam]);





  const submitAnswer = ()=>{


    if(!selected){

      alert("Option select karo");

      return;

    }


    if(selected === questions[current].correctAnswer){

      setScore(prev=>prev+1);

    }


    setShowResult(true);


  };





  const nextQuestion = ()=>{


    setSelected("");

    setShowResult(false);



    if(current < questions.length-1){


      setCurrent(prev=>prev+1);


    }
    else{


      alert(
        `Test Complete Score: ${score}/${questions.length}`
      );


      navigate("/dashboard");


    }


  };





  if(loading){

    return (

      <h2 className="p-8 text-xl">
        Loading Questions...
      </h2>

    );

  }





  if(questions.length===0){

    return (

      <h2 className="p-8 text-xl">
        No Questions Found
      </h2>

    );

  }




  const question = questions[current];




  return (

    <div className="min-h-screen bg-gray-100 p-8">


      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">


        <h1 className="text-3xl font-bold">

          {exam} Test

        </h1>



        <p className="mt-4">

          Question {current+1}/{questions.length}

        </p>




        <h2 className="text-xl font-bold mt-5">

          {question.question}

        </h2>




        <div className="mt-5 space-y-3">


        {

          question.options.map((option,index)=>(


            <button

            key={index}

            onClick={()=>setSelected(option.text)}

            className={`block w-full text-left p-3 border rounded-lg ${
              
              selected===option.text
              ?
              "bg-blue-100"
              :
              ""

            }`}

            >

              {option.text}

            </button>


          ))

        }


        </div>





        {!showResult && (

          <button

          onClick={submitAnswer}

          className="mt-6 bg-green-600 text-white px-6 py-3 rounded"

          >

            Submit Answer

          </button>

        )}






        {showResult && (


          <div className="mt-6 bg-gray-100 p-5 rounded">


            {

            selected===question.correctAnswer

            ?

            <h3 className="text-green-600 font-bold">
              ✅ Correct Answer
            </h3>

            :

            <h3 className="text-red-600 font-bold">
              ❌ Wrong Answer
            </h3>

            }



            <p className="mt-3">

              Correct Answer:
              <b>
              {" "}
              {question.correctAnswer}
              </b>

            </p>




            <p className="mt-3">

              Explanation:

              <br/>

              {question.explanation}

            </p>




            <h3 className="font-bold mt-5">

              All Options Explanation

            </h3>




            {

            question.options.map((option,index)=>(


              <div

              key={index}

              className="mt-3 p-3 border rounded"

              >


                <b>

                {option.text}

                </b>


                <p>

                {option.explanation}

                </p>


              </div>


            ))

            }




            <button

            onClick={nextQuestion}

            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded"

            >

              Next Question

            </button>



          </div>


        )}



      </div>


    </div>

  );


}


export default Test;