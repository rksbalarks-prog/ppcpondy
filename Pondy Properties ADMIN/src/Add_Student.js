
import axios from 'axios';
import { useState,useEffect } from 'react';
import {Container,Row,Col,Table} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Add_Student()
{
    let[name, setname] = useState('');
    let[phone, setphone] = useState('');
    let[location, setlocation] = useState('');
    let[regno, setregno] = useState('');
    let[course, setcourse] = useState('');
    let[duration, setduration] = useState('');
    let[fees, setfees] = useState('');
    let[received, setreceived] = useState('');
    let[pending, setpending] = useState('');
    let[balance, setbalance] = useState('');
    let[status, setstatus] = useState('');

     let nav = new useNavigate();
    useEffect(() =>
        {
      
             let name = localStorage.getItem("name");
      
              
             if(!name)
             {
                 nav('/');
             }
      
        },[])


    const add_data = (e) =>

        {

            e.preventDefault();
            if((name =='') && (phone =='') && (regno =='') && (fees =='') && (received =='') )
            {
                alert("Please All the info")
            }
           
             else
             {

             axios.post('http://localhost:3001/student/add', 
                {
                    name :name,
                    phone:phone,
                    location:location,
                    regno:regno,
                    course:course,
                    duration:duration,
                    fees:fees,
                    received:received,
                    pending:pending,
                    balance:balance,
                    status:status,
                }
             )

             .then((res) =>
            {
                alert(res.data.message);

                if(res.data.message =="Student Added Sucessfully")
                {
                    nav('/student')
                }
              

            })
             }
        }


        let goback = () =>
        {
            nav('/student')
        }
 
    return(
        <Container>

             

            <Row className='m-5'>
            <Col  className='text-start'>
                 <button onClick={goback} className='btn btn-warning ms-2'>Go Back</button>
                </Col>
                <Col className='text-start'>
                <h2 className='text-info'> Add Student  Details</h2>

                </Col>
                
            </Row>
            <Row>
                <Col>

                <form  onSubmit={add_data}>

                        <h1 className="text-center m-4 bg-warning p-2 text-white">Particulars</h1>

                            <input required type="text" placeholder="Name " onChange={(e) => setname(e.target.value)} />
                            <input required type="number" placeholder="Phone "  onChange={(e) => setphone(e.target.value)} />
                            <input required type="text" placeholder="Location " onChange={(e) => setlocation(e.target.value)} />
                            <input required type="text" placeholder="Reg no "  onChange={(e) => setregno(e.target.value)}/>
                            <input required type="text" placeholder="Course "  onChange={(e) => setcourse(e.target.value)}/>
                            <input required type="text" placeholder="Duration " onChange={(e) => setduration(e.target.value)} />
                            <input required type="text" placeholder="Fees " onChange={(e) => setfees(e.target.value)} />
                            <input required type="text" placeholder="Received  "  onChange={(e) => setreceived(e.target.value)}/>
                            <input required type="text" placeholder="Pending  "  onChange={(e) => setpending(e.target.value)}/>
                            <input required type="text" placeholder="Balance  " onChange={(e) => setbalance(e.target.value)} />
                            <input required type="text" placeholder="Status  "  onChange={(e) => setstatus(e.target.value)}/>
                            <input required type="submit"    />


                        </form>
                        
                </Col>
            </Row>
        </Container>
    )
}