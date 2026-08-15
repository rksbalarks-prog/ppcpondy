import React, { useState } from 'react';

export default function Button() {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [mul, setMul] = useState("");
    const [newval, setNewVal] = useState([]);

    const setEndValue = (value) => {
        setEnd(value);
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
                startVal,
                endVal,
                mulVal,
                result: res
            });
            startVal++;
        }
        setNewVal(tableData);
    };

    return (
        <div>
            <h1>Tables</h1>
            <form style={{ margin: "40px" }} onSubmit={multipletable}>
                <input
                    type='number'
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    placeholder='start'
                />
                <br /><br />
                <button type="button" onClick={() => setEndValue(10)}>Set End to 10</button>
                <br /><br />
                <input
                    type='number'
                    value={mul}
                    onChange={(e) => setMul(e.target.value)}
                    placeholder='multiple'
                />
                <br /><br />
                <input type='submit' value="Generate Table" />
            </form>
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
                                    <td>{item.startVal}</td>
                                    <td>{item.endVal}</td>
                                    <td>{item.mulVal}</td>
                                    <td>{item.result}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
