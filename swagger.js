const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My Express API',
    description: 'API documentation for my Express application',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

// Generate swagger-output.json file
swaggerAutogen(outputFile, endpointsFiles, doc);
