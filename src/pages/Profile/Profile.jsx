function Profile() {

  const user = JSON.parse(localStorage.getItem("user"));


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-gray-800 text-center">
          My Profile
        </h1>


        <div className="mt-8 space-y-5">


          <div>
            <p className="text-gray-500">
              Name
            </p>

            <h2 className="text-xl font-semibold">
              {user?.name || "User"}
            </h2>
          </div>



          <div>
            <p className="text-gray-500">
              Email
            </p>

            <h2 className="text-xl font-semibold">
              {user?.email || "No Email"}
            </h2>
          </div>



          <div>
            <p className="text-gray-500">
              Account Status
            </p>

            <h2 className="text-xl font-semibold text-green-600">
              Active
            </h2>
          </div>


        </div>

      </div>

    </div>
  );
}


export default Profile;