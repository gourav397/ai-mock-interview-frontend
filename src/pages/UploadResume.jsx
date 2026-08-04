import { useState } from "react";
import API from "../services/api";

function UploadResume() {

    const [file,setFile] = useState(null);

    const [text,setText] = useState("");

    const uploadResume = async()=>{

        if(!file){

            return alert("Choose Resume");

        }

        const formData =
            new FormData();

        formData.append(
            "resume",
            file
        );

        try{

            const res =
                await API.post(

                    "/upload/resume",

                    formData,

                    {

                        headers:{

                            "Content-Type":"multipart/form-data"

                        }

                    }

                );

            alert("Uploaded");

            setText(
                res.data.extractedText
            );

        }

        catch(error){

            alert(error.response?.data?.message);

        }

    };



    return(

        <div
        className="p-10"
        >

            <h1
            className="text-3xl font-bold"
            >

                Upload Resume

            </h1>

            <input

            type="file"

            accept=".pdf,.docx,.txt"

            onChange={(e)=>{

                setFile(
                    e.target.files[0]
                );

            }}

            className="mt-5"

            />

            <br/>

            <button

            onClick={uploadResume}

            className="bg-blue-600 text-white px-5 py-3 rounded mt-5"

            >

                Upload

            </button>

            <textarea

            value={text}

            readOnly

            rows={20}

            className="w-full border mt-8 p-5"

            />

        </div>

    );

}

export default UploadResume;