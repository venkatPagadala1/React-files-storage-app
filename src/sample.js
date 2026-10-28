import React from 'react';
import ReactDOM from 'react-dom';


const element = React.createElement('h1', { style: {color: 'blue'} }, 'Welcome to Venkat!!!');
ReactDOM.render(element, document.getElementById('root'));