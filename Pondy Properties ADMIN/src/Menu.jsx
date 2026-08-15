


import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';

// Sample data for cards
const cardsData = [
  {
    name: 'MR. ABHI FALDU',
    placementCompany: 'The Android Mania',
    position: 'Android Developer',
    studentImage: 'https://tse2.mm.bing.net/th?id=OIP.AbGafkazjc_S1pZPh0B9cQHaIm&pid=Api&P=0&h=180',
  },
  {
    name: 'MR. ABHI FALDU',
    placementCompany: 'The Android Mania',
    position: 'Android Developer',
    studentImage: 'https://tse2.mm.bing.net/th?id=OIP.AbGafkazjc_S1pZPh0B9cQHaIm&pid=Api&P=0&h=180',
  },
  {
    name: 'MR. ABHI FALDU',
    placementCompany: 'The Android Mania',
    position: 'Android Developer',
    studentImage: 'https://tse2.mm.bing.net/th?id=OIP.AbGafkazjc_S1pZPh0B9cQHaIm&pid=Api&P=0&h=180',
  },
];

const Menu = () => {
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredCardIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredCardIndex(null);
  };
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Menu ",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  return (
    <>
      <style>{`
        @keyframes beat {
          to { transform: scale(1.1); }
        }

        .beat-border-animation {
          border: 5px solid #f64a35;
          animation: beat 0.25s infinite alternate;
          transform-origin: center;
        }
        .beat-border-animation-hovered {
          border-color: #f64a35;
        }

        .card-hover-effect {
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .card-hover-effect:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          transform: scale(1.03);
        }
      `}</style>
      <Container className="mt-5">
        <Row>
          {cardsData.map((card, index) => (
            <Col
              key={index}
              sm={12}
              md={6}
              lg={4}
              className="mb-4 d-flex justify-content-center"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <Card
                className="congratulation-card text-center card-hover-effect"
                style={{
                  width: '100%',
                  maxWidth: '450px',
                  height: 'auto',
                  border: '2px solid #e8e8e8',
                  padding: '0',
                  position: 'relative',
                  boxShadow: '7px 5px 21px -9px rgba(0,0,0,0.6)',
                }}
              >
                <Card.Img
                  variant="top"
                  src="https://image.freepik.com/free-photo/business-people-shaking-hands-lots-copy-space_53419-4937.jpg"
                  style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    objectFit: 'cover',
                    zIndex: 1,
                    opacity: '0.5'
                  }}
                />
                <Card.Body
                  className="d-flex flex-column align-items-center justify-content-center"
                  style={{ zIndex: 1 }}
                >
                  <div
                    className="header d-flex align-items-center justify-content-center"
                    style={{ marginBottom: '20px' }}
                  >
                    <Image
                      src="https://www.fitaacademy.in/includes/assets/img/fita-logo.png"
                      alt="FITA Academy Logo"
                      className="lion-icon"
                      style={{ width: '80px', marginRight: '10px' }}
                    />
                  </div>
                  <Card.Title
                    style={{
                      color: '#d9534f',
                      fontFamily: 'Georgia, serif',
                      fontSize: '2rem',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#d9534f',
                        color: 'white',
                        padding: '10px 20px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)',
                      }}
                    >
                      WE GIVE WINGS TO YOUR DREAMS
                    </div>
                  </Card.Title>
                  <h1
                    style={{
                      fontFamily: "'UnifrakturCook', cursive",
                      color: '#d9534f',
                      fontSize: '3rem',
                      margin: '0',
                    }}
                  >
                    Congratulation
                  </h1>
                  <p
                    style={{
                      ...(hoveredCardIndex === index && {
                        animation: 'beat 0.25s infinite alternate',
                      }),
                    }}
                  >
                    ON YOUR PLACEMENT
                  </p>
                  <Image
                    src={card.studentImage}
                    alt="Student"
                    roundedCircle
                    style={{
                      width: '150px',
                      height: '150px',
                      border: '5px solid #f64a35',
                      margin: '0',
                    }}
                  />
                  <div
                    className="placement-details p-2"
                    style={{
                      backgroundColor: 'rgb(212, 210, 210)',
                      width: '200px',
                      borderRadius: '5px',
                    }}
                  >
                    <p style={{ margin: '0' }}>{card.name}</p>
                    <p style={{ margin: '0' }}>For placement in</p>
                    <p style={{ margin: '0' }}>
                      <strong>{card.placementCompany}</strong>
                    </p>
                    <p style={{ margin: '0' }}>As {card.position}</p>
                  </div>
                 
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default Menu;
