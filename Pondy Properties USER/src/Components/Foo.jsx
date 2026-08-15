import React from 'react'

export default function Foo() {
  return (
    <>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Animated bottom navbar</title>
    <link
      href="https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css"
      rel="stylesheet"
    />
    <style
      dangerouslySetInnerHTML={{
        __html:
          ':root {\n    --bg-body: #dff9fb;\n    --bg-nav: #220455;\n    --color-nav: #644c89;\n    --color-nav-active: #fff;\n}\n\n* {\n    padding: 0;\n    margin: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    height: 100vh;\n    display: grid;\n    place-items: center;\n    font-family: cursive;\n    background-color: var(--bg-body);\n}\n\n#filter-svg {\n    display: none;\n}\n\n.nav {\n    position: relative;\n    list-style-type: none;\n    display: flex;\n    background-color: var(--bg-nav);\n    height: 80px;\n    border-radius: 20px;\n    filter: url("#goo");\n    /* border-bottom-right-radius: 20px; */\n}\n\n.nav li a {\n    text-decoration: none;\n    color: var(--color-nav);\n    width: 120px;\n    height: 100%;\n    display: inline-grid;\n    place-items: center;\n    font-size: 30px;\n    z-index: 1;\n    position: relative;\n    overflow: hidden;\n}\n\n.nav li a .title {\n    display: none;\n}\n\n.nav li a:hover {\n    color: var(--bg-body);\n}\n\n.nav li a.nav-item-active {\n    color: var(--color-nav-active);\n    transform: translateY(-20%);\n    font-size: 45px;\n    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n}\n\n.nav li a.nav-item-active .title {\n    display: block;\n    font-size: 16px;\n}\n\n.nav .nav-indicator {\n    width: 90px;\n    height: 90px;\n    border-radius: 50%;\n    background-color: var(--bg-nav);\n    position: absolute;\n    top: -35px;\n    left: calc(300px - 45px);\n    z-index: -1;\n    transition: left 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n    /* cubic-bezier(0.175, 0.885, 0.32, 1.275) */\n}\n\n@keyframes zoom {\n    0% {\n        width: 0px;\n        height: 0px;\n        opacity: 0.2;\n    }\n    100% {\n        width: 1500px;\n        height: 1500px;\n        opacity: 0;\n    }\n}'
      }}
    />
    <ul className="nav">
      <span className="nav-indicator" />
      <li>
        <a href="#">
          <i className="bx bx-home" />
          <span className="title">Home</span>
        </a>
      </li>
      <li>
        <a href="#">
          <i className="bx bx-receipt" />
          <span className="title">Receipt</span>
        </a>
      </li>
      <li>
        <a href="#" className="nav-item-active">
          <i className="bx bx-plus-circle" />
          <span className="title">Add</span>
        </a>
      </li>
      <li>
        <a href="#">
          <i className="bx bx-bell" />
          <span className="title">Noti</span>
        </a>
      </li>
      <li>
        <a href="#">
          <i className="bx bx-user" />
          <span className="title">Account</span>
        </a>
      </li>
    </ul>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="filter-svg">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  </>  )
}
