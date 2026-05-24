import SpendForm from "../component/SpendForm";

export default function Audit(){
    return (
        <div className="min-h-screen flex justify-center ">
            <div>

            
            <div className="m-10 mx-auto">
                <h1 className="text-4xl font-bold">
                    Audit your AI spend   
                </h1>
                <p className="mt-2 text-xl text-gray-500">Add tools your team pays for</p>
            </div>
            <SpendForm></SpendForm>
            </div>
        </div>
    )
}