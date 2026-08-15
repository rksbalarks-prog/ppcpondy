import { useState } from "react";

 export default function Form()
 {


    let desgn = 
    {margin:"10px"}
  let[name ,setname]= useState('');
  let[phone ,setphone]= useState('');
  let[gender ,setgender]= useState('');
  let[lan ,setlan]= useState([]);
  let[cls ,setcls]= useState('');

    let submitdata = (e) =>
    {
        e.preventDefault();
    }

    let onchagecheckbox = (e) =>
    {
        let val = e.target.value;
        let type = e.target.checked;

        if(type)
        {
            setlan((old) => [...old, val])

        }

        else
        {
            setlan(lan.filter((old) => old != val))

        }

         
    }

    return(
        <div className="container m-3 text-left">

            <h1> Your Name is : {name}</h1>
            <h1> Your Phone no is : {phone}</h1>
            <h1> Your Gender is : {gender}</h1>
            <h1> Your Lan is : {lan}</h1>
            <h1> Your Class is : {cls}</h1>


         <h1> Ticket Booking Form</h1>



         <form onSubmit={submitdata}>

            <div style={desgn}>
            <input type="text" placeholder="Enter Your Name"
            onChange={(e)=> setname(e.target.value) } />

            </div>

            <div style={desgn}>
            <input type="number" placeholder="Enter Your Phone"
            onChange={(e)=> setphone(e.target.value)} />

            </div>

        

            <div style={desgn}>
            <input type="radio" value="male" name="geder" onChange={(e)=> setgender(e.target.value)}/> Male
            <input type="radio" value="female" name="geder" onChange={(e)=> setgender(e.target.value)} /> FeMale

            </div>

            <div style={desgn}>
            <input type="checkbox"  value="English"
             onChange={onchagecheckbox}  /> English
            <input type="checkbox" value="Tamil"
             onChange={onchagecheckbox}   /> Tamil
            <input type="checkbox" value="Hindi"
             onChange={onchagecheckbox}   /> Hindi
            <input type="checkbox" value="French"
             onChange={onchagecheckbox}   /> French

            </div>

         

            <div style={desgn}>
                <select onChange={(e)=> setcls(e.target.value)}>
                    <option value=""> Select One</option>
                    <option value="First"> First Class</option>
                    <option value="Second"> Second Class</option>
                    <option value="Third"> Third Class</option>

                </select>
            </div>

            <div style={desgn}>
                <input type="submit" />
            </div>

             
         </form>
        
         </div>
    )
 }