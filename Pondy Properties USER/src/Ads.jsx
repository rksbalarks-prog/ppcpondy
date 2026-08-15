import React from 'react'

export default function Ads() {
    const images = [
        'https://ads.timesgroup.com/assets/images/Slider/PR/Mobile/Multi-PRTemplate-2.jpg',  // Example image URLs
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShKmqPKadsxdZLlK0mxZQ4WGUwwPrA8kuPXA&s',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbGFxTju12ehKnWCaM7lhHaE85_iIIiRZyjg&s',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpwDRuCNSxXa-3RGn9y5f6NA8DV0Vy5d08OTvTjiK79DfZsQ1mQITOfg973MKEYsdtVVg&usqp=CAU',
        'https://img.pikbest.com/origin/09/18/75/73bpIkbEsTzy5.jpg!w700wp',
        'https://via.placeholder.com/280',
      ];
  return (
<div className="container-fluid">
      <div className="col">
        {images.map((src, index) => (
          <div key={index} className="col-12">
            <img src={src} alt={`Image ${index}`}
             style={{ width: '100%', height: '350px',objectFit: 'cover',objectPosition: 'center'}} className='mb-5'/>
          </div>
        ))}
      </div>
    </div>  )
}
