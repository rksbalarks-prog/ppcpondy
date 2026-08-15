import React ,{useState} from 'react'
import './Tabl.css'

export default function FinalTable() {
    const [table, setTable] = useState([]);
    const [loopLimit, setLoopLimit] = useState(10);
    const [startloopLimit, setStartLoopLimit] = useState(1);
  
    const startlimit = (limit) =>{
        setStartLoopLimit(limit)
      }; 
    const endLimit = (limit) =>{
      setLoopLimit(limit)
    }; 
    const generateTable = (number) => {
      let newTable = [];
      for (let i = startloopLimit; i <= loopLimit; i++) {
        newTable.push(`${number} x ${i} = ${number * i}`);
      }
      setTable(newTable);
    };
    return (
      <>
      <div className='box'>
        <div className='inner1'>
  
            <button className='btt' onClick={() => startlimit(3)}>start in 3</button>
            <button className='btt' onClick={() => endLimit(20)}>end in 20</button>
  
        </div>
        <div className='inner2'>
          <button className='bt' onClick={() => generateTable(1)}> 1</button>
          <button className='bt' onClick={() => generateTable(2)}> 2</button>
          <button className='bt' onClick={() => generateTable(3)}>3 </button>
          <button className='bt' onClick={() => generateTable(4)}>4 </button>
          <button className='bt' onClick={() => generateTable(5)}>5 </button>
          <button className='bt' onClick={() => generateTable(6)}>6 </button>
          <button className='bt' onClick={() => generateTable(7)}>7 </button>
          <button className='bt' onClick={() => generateTable(8)}>8 </button>
          <button className='bt' onClick={() => generateTable(9)}>9</button>
          <button className='bt' onClick={() => generateTable(10)}>10</button>
        </div>
      </div>
      <table>
          <tbody>
            {table.map((row, index) => (
              <tr key={index}>
                <td>{row}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
}
