import React, { useState } from 'react';
import './Formtable.css';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

export default function Tabinput() {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [mul, setMul] = useState("");
    const [newval, setNewVal] = useState([]);

    const handleFirstInputChange = (e) => {
        const value = e.target.value.trim();
        setStart(value);
        if (value === '') {
            setEnd('');
        }
    };

    const setMultipleValue = (value) => {
        setMul(value);
    };

    const multipletable = (e) => {
        e.preventDefault();
        let startVal = parseInt(start);
        let endVal = parseInt(end);
        let mulVal = parseInt(mul);

        if (isNaN(startVal) || isNaN(endVal) || isNaN(mulVal)) {
            alert("Please enter valid numbers.");
            return;
        }

        let tableData = [];
        while (startVal <= endVal) {
            let res = startVal * mulVal;
            tableData.push({
                starta: startVal,
                enda: endVal,
                mula: mulVal,
                result: res
            });
            startVal++;
        }

        setNewVal(tableData);
    };

    return (
        <>
            <div className='box'>
                <h1>Tables</h1>
                <Form style={{ margin: "40px" }} onSubmit={multipletable}>
                    <Row>
                        <input
                            className='inp'
                            type='number'
                            value={start}
                            onChange={handleFirstInputChange}
                            placeholder='start'
                        />{" "}

                        <input
                            className={`inp ${start === '' ? 'disabled' : ''}`}
                            type='number'
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            placeholder='end'
                            disabled={start === ''}
                        />{" "}
                    </Row>
                    <Row>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button key={num} type="button" className='btnn' onClick={() => setMultipleValue(num)}>{num}</button>
                        ))}
                    </Row>
                    <br /><br />
                    <input className='btsub' type='submit' />
                </Form>
            </div>
            <div>
                {newval.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Start Value</th>
                                <th>End Value</th>
                                <th>Multiply By</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newval.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.starta}</td>
                                    <td>{item.enda}</td>
                                    <td>{item.mula}</td>
                                    <td>{item.result}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}