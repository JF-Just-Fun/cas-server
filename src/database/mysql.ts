import { DataSourceOptions, DataSource } from 'typeorm';
import * as Model from '../models';

const options: DataSourceOptions = {
  name: 'mysql',
  type: 'mysql',
  host: process.env.MYSQL_HOST, // '101.43.5.99'
  port: parseInt(process.env.MYSQL_PORT), // 13333,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD, // 'DUANcas4815883',
  database: process.env.MYSQL_DATABASE, // 'cas',
  // /* Indicates if database schema should be auto created on every application launch. */
  synchronize: true,
  logging: false,
  entities: Object.values(Model),
};

console.log('=> database connecting...');

const dataSource = new DataSource(options);
dataSource.initialize().then(
  (dataSource) => console.log('database connected!'),
  (error) => console.log('Cannot connect: ', error),
);

export default dataSource;
