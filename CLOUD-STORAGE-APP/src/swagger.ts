// src/swagger.ts
import ENV from './env';
import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/app.ts'];

const doc = {
  info: {
    title: 'Cloud Service App',
    description: 'API Documentation for Cloud Storage to collect large number of data.',
    version: '1.0.0',
  },
  host: ENV.BASE_URL.replace(/^https?:\/\//, ''),
  schemes: [ENV.BASE_URL.split(':')[0]],
};

swaggerAutogen()(outputFile, endpointsFiles, doc);
